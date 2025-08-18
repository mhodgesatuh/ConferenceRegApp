// backend/src/routes/registration.ts

import { Router } from "express";
import { db } from "@/db/client";
import { credentials, registrations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { log, sendError } from "@/utils/logger";
import { sendEmail } from "@/utils/email";

interface CreateRegistrationBody {
    id?: number;
    email: string;
    phone1?: string;
    phone2?: string;
    firstName?: string;
    lastName: string;
    namePrefix?: string;
    nameSuffix?: string;
    hasProxy?: boolean;
    proxyName?: string;
    proxyPhone?: string;
    proxyEmail: string;
    cancelledAttendance?: boolean;
    cancellationReason?: string;
    day1Attendee?: boolean;
    day2Attendee?: boolean;
    question1: string;
    question2: string;
    isAttendee?: boolean;
    isCancelled?: boolean;
    isMonitor?: boolean;
    isOrganizer?: boolean;
    isPresenter?: boolean;
    isSponsor?: boolean;
}

// Generate a pin for users to use to return to their registration info.
function generatePin(length: number): string {
    let pin = "";
    for (let i = 0; i < length; i++) {
        pin += Math.floor(Math.random() * 10).toString();
    }
    return pin;
}

const router = Router();

const SAVE_REGISTRATION_ERROR = "Failed to save registration";

// Columns marked as NOT NULL in the database schema. These need to be
// present before attempting to insert a record.
const REQUIRED_FIELDS: (keyof CreateRegistrationBody)[] = [
    "email",
    "lastName",
    "question1",
    "question2",
];

/** Redact potentially sensitive fields before logging */
function redact(body: Partial<CreateRegistrationBody> | undefined) {
    if (!body) return {};
    const clone: Record<string, unknown> = { ...body };
    (["loginPin", "pin", "password"] as const).forEach((k) => {
        if (k in clone) clone[k] = "<redacted>";
    });
    return clone;
}

/** Normalize booleans (MariaDB tinyint(1)) */
const toBool = (v: unknown, defaultVal = false) =>
    typeof v === "boolean" ? v : v == null ? defaultVal : Boolean(v);

/** Normalize strings to null if blank */
const toNull = (v: unknown) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length === 0 ? null : s;
};

/* POST / */
router.post<{}, any, CreateRegistrationBody>("/", async (req, res): Promise<void> => {
    const email = req.body?.email?.trim().toLowerCase();

    try {
        const missing = REQUIRED_FIELDS.filter((field) => !req.body[field]);
        if (missing.length) {
            sendError(res, 400, "Missing required information", { missing });
            return;
        }

        const loginPin = generatePin(8);

        // Save registration + credential in a single transaction
        const { id } = await db.transaction<{ id: number }>(async (tx) => {
            const result = await tx.insert(registrations).values({
                email,
                phone1: toNull(req.body.phone1),
                phone2: toNull(req.body.phone2),
                firstName: toNull(req.body.firstName),
                lastName: String(req.body.lastName).trim(),
                namePrefix: toNull(req.body.namePrefix),
                nameSuffix: toNull(req.body.nameSuffix),
                hasProxy: toBool(req.body.hasProxy),
                proxyName: toNull(req.body.proxyName),
                proxyPhone: toNull(req.body.proxyPhone),
                proxyEmail: toNull(req.body.proxyEmail ? String(req.body.proxyEmail).toLowerCase() : null),
                cancelledAttendance: toBool(req.body.cancelledAttendance),
                cancellationReason: toNull(req.body.cancellationReason),
                day1Attendee: toBool(req.body.day1Attendee),
                day2Attendee: toBool(req.body.day2Attendee),
                question1: String(req.body.question1).trim(),
                question2: String(req.body.question2).trim(),
                isAttendee: true,
                isCancelled: toBool(req.body.isCancelled),
                isMonitor: toBool(req.body.isMonitor),
                isOrganizer: toBool(req.body.isOrganizer),
                isPresenter: toBool(req.body.isPresenter),
                isSponsor: toBool(req.body.isSponsor),
            });

            // MariaDB/MySQL: auto-increment PK is available as insertId (ResultSetHeader / OkPacket)
            const insertId = (result as unknown as { insertId?: number })?.insertId;
            let newId: number | undefined =
                typeof insertId === "number" && insertId > 0 ? insertId : undefined;

            // Fallback: load the row we just created. Prefer a unique column if enforced.
            if (!newId) {
                const row = await tx
                    .select({ id: registrations.id })
                    .from(registrations)
                    .where(eq(registrations.email, email!))
                    .limit(1);
                if (row.length === 0) {
                    throw new Error("Insert did not return insertId and row not found");
                }
                newId = row[0].id!;
            }

            await tx.insert(credentials).values({ registrationId: newId, loginPin });

            return { id: newId };
        });

        log.info("Registration created", { email, registrationId: id });
        res.status(201).json({ id, loginPin });
    } catch (err) {
        log.error(SAVE_REGISTRATION_ERROR, {
            email,
            registrationId: undefined,
            cause: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            body: redact(req.body),
        });
        sendError(res, 500, SAVE_REGISTRATION_ERROR, {
            cause: err instanceof Error ? err.message : String(err),
        });
    }
});

/* GET /login?email=addr&pin=code */
router.get("/login", async (req, res): Promise<void> => {
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;
    const pin = req.query.pin ? String(req.query.pin).trim() : undefined;

    if (!email || !pin) {
        log.warn("Login failed: missing credentials", {
            email,
            registrationId: undefined,
            emailProvided: !!email,
            pinProvided: !!pin,
        });
        sendError(res, 400, "Missing credentials", {
            emailProvided: !!email,
            pinProvided: !!pin,
        });
        return;
    }

    try {
        const [record] = await db
            .select()
            .from(registrations)
            .innerJoin(credentials, eq(credentials.registrationId, registrations.id))
            .where(and(eq(registrations.email, email), eq(credentials.loginPin, pin)));

        if (!record?.registrations) {
            log.warn("Registration lookup: not found", { email, registrationId: undefined });
            sendError(res, 404, "Registration not found", { email });
            return;
        }

        log.info("Login successful", {
            email,
            registrationId: record.registrations.id,
        });
        res.json({
            registration: {
                ...record.registrations,
                loginPin: record.credentials.loginPin,
            },
        });
    } catch (err) {
        log.error("Failed to fetch registration (login)", {
            email,
            registrationId: undefined,
            cause: err instanceof Error ? err.message : String(err),
        });
        sendError(res, 500, "Failed to fetch registration", {
            email,
            cause: err instanceof Error ? err.message : String(err),
        });
    }
});

/* GET /lost-pin?email=addr */
router.get("/lost-pin", async (req, res): Promise<void> => {
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;

    if (!email) {
        log.warn("Lost PIN: email required", {
            email: undefined,
            registrationId: undefined,
        });
        sendError(res, 400, "Email required");
        return;
    }

    try {
        const [registration] = await db
            .select()
            .from(registrations)
            .where(eq(registrations.email, email));

        if (!registration) {
            log.warn("Lost PIN: registration not found", { email, registrationId: undefined });
            sendError(res, 404, "Please contact PCATT", { email });
            return;
        }

        const [credential] = await db
            .select()
            .from(credentials)
            .where(eq(credentials.registrationId, registration.id));

        if (!credential) {
            log.warn("Lost PIN: credential not found", { email, registrationId: registration.id });
            sendError(res, 404, "Please contact PCATT", { email, registrationId: registration.id });
            return;
        }

        await sendEmail({
            to: email,
            subject: "Your login pin",
            text: `Your login PIN is ${credential.loginPin}`,
        });
        log.info("Sending pin", { email, registrationId: registration.id });
        res.json({ sent: true });
    } catch (err) {
        log.error("Failed to send pin", {
            email,
            registrationId: undefined,
            cause: err instanceof Error ? err.message : String(err),
        });
        sendError(res, 500, "Failed to send pin", {
            email,
            cause: err instanceof Error ? err.message : String(err),
        });
    }
});

/* GET /:id */
router.get<{ id: string }, any>("/:id", async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        log.warn("Fetch by id: invalid id", {
            email: undefined,
            registrationId: undefined,
            rawId: req.params.id,
        });
        sendError(res, 400, "Invalid ID", { raw: req.params.id });
        return;
    }

    try {
        const [record] = await db
            .select()
            .from(registrations)
            .innerJoin(credentials, eq(credentials.registrationId, registrations.id))
            .where(eq(registrations.id, id));

        if (!record?.registrations) {
            log.warn("Fetch by id: not found", { email: undefined, registrationId: id });
            sendError(res, 404, "Registration not found", { id });
            return;
        }

        log.info("Registration fetched", {
            email: record.registrations.email,
            registrationId: id,
        });
        res.json({
            registration: {
                ...record.registrations,
                loginPin: record.credentials.loginPin,
            },
        });
    } catch (err) {
        log.error("Failed to fetch registration by id", {
            email: undefined,
            registrationId: id,
            cause: err instanceof Error ? err.message : String(err),
        });
        sendError(res, 500, "Failed to fetch registration", {
            id,
            cause: err instanceof Error ? err.message : String(err),
        });
    }
});

// --- Router-level 404 (must be last) ---
router.all("*", (req, res) => {
    const ROUTE_NOT_FOUND = "Internal error: route not found";
    log.warn(ROUTE_NOT_FOUND, { method: req.method, path: req.originalUrl });
    sendError(
        res,
        404,
        req.method === "POST" ? ROUTE_NOT_FOUND : "Not found",
        {
            method: req.method,
            path: req.originalUrl,
        },
    );
});

export default router;
