import { NextFunction, Request, Response, Router } from "express";
import multer, { MulterError } from "multer";

import { requireAuth } from "@/utils/auth";
import { log, sendError } from "@/utils/logger";
import { generatePin, isValidEmail } from "./registration.utils";
import { getRegistrationByEmail } from "./registration.service";
import { db } from "@/db/client";
import { credentials, registrations } from "@/db/schema";
import { eq, isNull, or } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";
import { sendEmail } from "@/utils/email";
import { fillRsvpTemplate, loadRsvpTemplate } from "@/utils/emailTemplates";

const router = Router();

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME = new Set([
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.ms-excel",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter(_req, file, cb) {
    const mime = (file.mimetype || "").toLowerCase();
    if (mime && !ALLOWED_MIME.has(mime)) {
      cb(new MulterError("LIMIT_UNEXPECTED_FILE", "Unsupported file type"));
      return;
    }
    cb(null, true);
  },
});
const singleCsvUpload = upload.single("file");

function organizerOnly(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).isOrganizer) {
    sendError(res, 403, "Unauthorized");
    return;
  }
  next();
}

type CsvRow = { rowNumber: number; columns: string[] };
type PreparedRow = {
  rowNumber: number;
  email: string;
  name: string;
  isOrganizer: boolean;
  isPresenter: boolean;
};
type CreatedRow = PreparedRow & { registrationId: number; loginPin: string };
type ReminderTarget = {
  registrationId: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  loginPin: string;
};
type RowIssue = { row: number; problems: string[] };

// ---- Subjects here so they’re easy to tweak or localize later
const SUBJECT_INVITE = "Conference RSVP";
const SUBJECT_REMINDER = "Conference RSVP Reminder";

// ---------------- CSV helpers ----------------
function parseCsv(content: string): { rows: CsvRow[]; error?: string } {
  let text = content;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  text = text.replace(/\r\n/g, "\n");

  const rows: CsvRow[] = [];
  let current: string[] = [];
  let field = "";
  let insideQuotes = false;
  let rowNumber = 1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (insideQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
          continue;
        }
        insideQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      insideQuotes = true;
      continue;
    }
    if (char === ",") {
      current.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      current.push(field);
      rows.push({ rowNumber, columns: current });
      current = [];
      field = "";
      rowNumber += 1;
      continue;
    }
    if (char === "\r") continue;
    field += char;
  }

  if (insideQuotes) return { rows: [], error: "CSV appears to have mismatched quotes" };

  current.push(field);
  rows.push({ rowNumber, columns: current });

  const filtered = rows.filter((row) => row.columns.some((col) => col.trim() !== ""));
  return { rows: filtered };
}

function looksLikeHeader(row: CsvRow): boolean {
  if (row.columns.length < 2) return false;
  const first = (row.columns[0] || "").trim().toLowerCase();
  const second = (row.columns[1] || "").trim().toLowerCase();
  if (!first) return false;
  if (first === "email") return true;
  return first.includes("email") && second.includes("name");
}

function normalizeRole(raw: string): { isOrganizer: boolean; isPresenter: boolean } | null {
  const value = raw.trim().toUpperCase();
  if (!value) return { isOrganizer: false, isPresenter: false };
  if (value === "O") return { isOrganizer: true, isPresenter: false };
  if (value === "P") return { isOrganizer: false, isPresenter: true };
  if (value === "OP" || value === "PO") return { isOrganizer: true, isPresenter: true };
  return null;
}

function splitName(fullName: string): { firstName: string | null; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: null, lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: null, lastName: parts[0] };
  const firstName = parts.shift() ?? null;
  const lastName = parts.join(" ").trim();
  return { firstName, lastName: lastName || (firstName ?? trimmed) };
}

function addIssue(store: Map<number, string[]>, rowNumber: number, message: string) {
  const existing = store.get(rowNumber) ?? [];
  existing.push(message);
  store.set(rowNumber, existing);
}

async function ensureNoExistingRegistrations(rows: PreparedRow[], issues: Map<number, string[]>) {
  for (const row of rows) {
    const [existing] = await getRegistrationByEmail(row.email);
    if (existing) {
      addIssue(issues, row.rowNumber, "Email is already registered");
      log.error("RSVP upload email already exists", {
        rowNumber: row.rowNumber,
        email: row.email,
        registrationId: (existing as any)?.id,
      });
    }
  }
}

async function persistRows(rows: PreparedRow[]): Promise<CreatedRow[]> {
  const created: CreatedRow[] = [];
  const PLACEHOLDER = "RSVP pending";

  await db.transaction(async (tx) => {
    for (const row of rows) {
      const loginPin = generatePin(8);
      const names = splitName(row.name);
      const { firstName } = names;

      const insertResult = await tx
        .insert(registrations)
        .values({
          email: row.email,
          firstName: firstName?.trim() || null,
          lastName: "", // empty lastName marks “pending RSVP” for reminder query
          isAttendee: true,
          isOrganizer: row.isOrganizer,
          isPresenter: row.isPresenter,
          question1: PLACEHOLDER,
          question2: PLACEHOLDER,
        })
        .$returningId();

      let registrationId: number | undefined;
      if (Array.isArray(insertResult)) {
        const first = insertResult[0];
        registrationId = typeof first === "number" ? first : (first as any)?.id;
      } else {
        registrationId = (insertResult as any)?.id;
      }
      if (!registrationId) {
        const [fallback] = await tx.execute(sql`SELECT LAST_INSERT_ID() AS id`);
        registrationId = (Array.isArray(fallback) ? (fallback as any)[0]?.id : (fallback as any)?.id) ?? undefined;
      }
      if (!registrationId) throw new Error("insert_failed");

      await tx.insert(credentials).values({ registrationId, loginPin });

      created.push({
        rowNumber: row.rowNumber,
        email: row.email,
        name: row.name,
        isOrganizer: row.isOrganizer,
        isPresenter: row.isPresenter,
        registrationId,
        loginPin,
      });
    }
  });

  return created;
}

// ---------------- Routes ----------------
router.post("/upload", requireAuth, organizerOnly, (req: Request, res: Response) => {
  singleCsvUpload(req, res, async (err: unknown) => {
    if (err) {
      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          sendError(res, 413, "CSV file is too large", { maxBytes: MAX_UPLOAD_BYTES });
          return;
        }
        sendError(res, 400, "CSV upload rejected", { reason: err.message });
        return;
      }
      sendError(res, 400, "CSV upload rejected", { reason: (err as Error)?.message });
      return;
    }

    const file = (req as any).file as (Express.Multer.File & { buffer: Buffer }) | undefined;
    if (!file) return sendError(res, 400, "No CSV file provided");
    if (!file.buffer || file.buffer.length === 0) return sendError(res, 400, "CSV file is empty");

    const csvText = file.buffer.toString("utf8");
    const { rows, error: parseError } = parseCsv(csvText);
    if (parseError) return sendError(res, 400, parseError);
    if (rows.length === 0) return sendError(res, 400, "CSV file did not contain any data");

    const dataRows = looksLikeHeader(rows[0]) ? rows.slice(1) : rows;
    if (dataRows.length === 0) return sendError(res, 400, "CSV file does not contain any RSVP rows");

    const issues = new Map<number, string[]>();
    const prepared: PreparedRow[] = [];
    const seenEmails = new Set<string>();

    for (const row of dataRows) {
      const trimmedColumns = row.columns.map((col) => (col ?? "").trim());
      const [rawEmail, rawName, rawRole = "", ...rest] = trimmedColumns;

      if (!rawEmail) addIssue(issues, row.rowNumber, "Missing email address");

      const email = (rawEmail || "").toLowerCase();
      if (rawEmail && !isValidEmail(email)) addIssue(issues, row.rowNumber, "Invalid email address");

      if (email) {
        if (seenEmails.has(email)) addIssue(issues, row.rowNumber, "Duplicate email in upload");
        else seenEmails.add(email);
      }

      if (!rawName) addIssue(issues, row.rowNumber, "Missing name");

      const roleInfo = normalizeRole(rawRole);
      if (roleInfo === null) addIssue(issues, row.rowNumber, `Invalid role designation "${rawRole}"`);

      const hasExtra = rest.some((v) => v.trim().length > 0);
      if (hasExtra) addIssue(issues, row.rowNumber, "Unexpected extra column data");

      if (!issues.has(row.rowNumber) && rawEmail && rawName && roleInfo) {
        prepared.push({
          rowNumber: row.rowNumber,
          email,
          name: rawName,
          isOrganizer: roleInfo.isOrganizer,
          isPresenter: roleInfo.isPresenter,
        });
      }
    }

    await ensureNoExistingRegistrations(prepared, issues);

    if (issues.size > 0) {
      const details: RowIssue[] = Array.from(issues.entries()).map(([rowNumber, problems]) => ({ row: rowNumber, problems }));
      log.warn("RSVP upload rejected", { issues: details });
      sendError(res, 400, "RSVP upload rejected", { issues: details });
      return;
    }

    const sendEmails = (process.env.SEND_EMAIL ?? "false").toLowerCase() === "true";
    const smtpServer = (process.env.SMTP_SERVER ?? "").trim();
    const rsvpUrl = (process.env.RSVP_URL ?? "").trim();

    if (!rsvpUrl) {
      log.error("RSVP_URL is not configured");
      sendError(res, 500, "RSVP_URL is not configured");
      return;
    }
    if (sendEmails && !smtpServer) {
      log.error("SEND_EMAIL is true but SMTP_SERVER is not configured");
      sendError(res, 500, "SMTP server is not configured");
      return;
    }

    let template: string;
    try {
      template = await loadRsvpTemplate();
    } catch (readErr) {
      log.error("Failed to load RSVP email template", { err: readErr });
      sendError(res, 500, "Email template not available");
      return;
    }

    let created: CreatedRow[];
    try {
      created = await persistRows(prepared);
    } catch (persistErr) {
      log.error("Failed to create RSVP registrations", { err: persistErr });
      sendError(res, 500, "Failed to create registrations");
      return;
    }

    const emailStats = { attempted: created.length, sent: 0, logged: 0, failures: [] as { email: string; error: string }[] };

    for (const entry of created) {
      const personalized = fillRsvpTemplate(template, entry.name, entry.loginPin, rsvpUrl);
      try {
        if (sendEmails) {
          await sendEmail({ to: entry.email, subject: SUBJECT_INVITE, text: personalized, smtpServer });
          emailStats.sent += 1;
          log.info("RSVP email sent", { email: entry.email, registrationId: entry.registrationId });
        } else {
          emailStats.logged += 1;
          log.info("RSVP email (send disabled)", {
            email: entry.email,
            registrationId: entry.registrationId,
            body: personalized,
          });
        }
      } catch (emailErr) {
        const message = emailErr instanceof Error ? emailErr.message : String(emailErr);
        emailStats.failures.push({ email: entry.email, error: message });
        log.error("Failed to deliver RSVP email", { email: entry.email, registrationId: entry.registrationId, error: message });
      }
    }

    res.status(201).json({ processed: created.length, email: emailStats });
  });
});

router.post("/remind", requireAuth, organizerOnly, async (req: Request, res: Response) => {
  const sendEmails = (process.env.SEND_EMAIL ?? "false").toLowerCase() === "true";
  const smtpServer = (process.env.SMTP_SERVER ?? "").trim();
  const rsvpUrl = (process.env.RSVP_URL ?? "").trim();

  if (!rsvpUrl) {
    log.error("RSVP_URL is not configured");
    sendError(res, 500, "RSVP_URL is not configured");
    return;
  }
  if (sendEmails && !smtpServer) {
    log.error("SEND_EMAIL is true but SMTP_SERVER is not configured");
    sendError(res, 500, "SMTP server is not configured");
    return;
  }

  let template: string;
  try {
    template = await loadRsvpTemplate();
  } catch (err) {
    log.error("Failed to load RSVP email template", { err });
    sendError(res, 500, "Email template not available");
    return;
  }

  let pending: ReminderTarget[];
  try {
    pending = await db
      .select({
        registrationId: registrations.id,
        email: registrations.email,
        firstName: registrations.firstName,
        lastName: registrations.lastName,
        loginPin: credentials.loginPin,
      })
      .from(registrations)
      .innerJoin(credentials, eq(credentials.registrationId, registrations.id))
      .where(or(isNull(registrations.lastName), eq(registrations.lastName, "")));
  } catch (err) {
    log.error("Failed to load pending RSVP reminders", { err });
    sendError(res, 500, "Failed to load pending RSVPs");
    return;
  }

  if (pending.length === 0) {
    log.info("No RSVP reminders to send");
    res.status(200).json({
      processed: 0,
      email: { attempted: 0, sent: 0, logged: 0, failures: [] as { email: string; error: string }[] },
    });
    return;
  }

  const emailStats = { attempted: pending.length, sent: 0, logged: 0, failures: [] as { email: string; error: string }[] };

  for (const target of pending) {
    const name = target.firstName?.trim() || target.email;
    const personalized = fillRsvpTemplate(template, name, target.loginPin, rsvpUrl);

    try {
      if (sendEmails) {
        await sendEmail({ to: target.email, subject: SUBJECT_REMINDER, text: personalized, smtpServer });
        emailStats.sent += 1;
        log.info("RSVP reminder email sent", { email: target.email, registrationId: target.registrationId });
      } else {
        emailStats.logged += 1;
        log.info("RSVP reminder email (send disabled)", {
          email: target.email,
          registrationId: target.registrationId,
          body: personalized,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      emailStats.failures.push({ email: target.email, error: message });
      log.error("Failed to deliver RSVP reminder email", {
        email: target.email,
        registrationId: target.registrationId,
        error: message,
      });
    }
  }

  res.status(200).json({ processed: pending.length, email: emailStats });
});

export default router;
