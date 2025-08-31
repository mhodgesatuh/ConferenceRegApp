// backend/src/routes/registration.ts

import { Router, Request, Response, NextFunction } from "express";
import { log, sendError } from "@/utils/logger";
import { sendEmail } from "@/utils/email";
import { createSession } from "@/utils/auth";
import { requirePin } from "@/middleware/requirePin";

import { generatePin, isValidPhone, toBool, toNull } from "./registration.utils";
import {
    createRegistration,
    updateRegistration,
    getRegistrationWithPinById,
    getRegistrationWithPinByLogin,
    getRegistrationByEmail,
    getCredentialByRegId,
} from "./registration.service";

interface CreateRegistrationBody {
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

function ownerOnly(req: Request, res: Response, next: NextFunction) {
    const regId = Number(req.params.id);
    const auth = (req as any).registrationAuth;
    if (!auth || auth.registrationId !== regId) {
        sendError(res, 403, "Unauthorized", { id: regId });
        return;
    }
    next();
}

/* POST / */
router.post("/", async (req, res): Promise<void> => {
    if (req.body?.id) {
        sendError(res, 405, "Use PUT /api/registrations/:id to update an existing registration");
        return;
    }
    const email = req.body?.email?.trim().toLowerCase();

    try {
        const missing = REQUIRED_FIELDS.filter((field) => !req.body[field]);
        if (missing.length) {
            sendError(res, 400, "Missing required information", { missing });
            return;
        }

        // Validate phones only if provided; empty is OK
        if (!isValidPhone(req.body.phone1) || !isValidPhone(req.body.phone2)) {
            sendError(res, 400, "Invalid phone number(s)", {
                phone1: req.body.phone1,
                phone2: req.body.phone2,
            });
            return;
        }

        const loginPin = generatePin(8);

        const { id } = await createRegistration(
            {
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
                isAttendee: true, // always true on create
                isCancelled: toBool(req.body.isCancelled),
                isMonitor: toBool(req.body.isMonitor),
                isOrganizer: toBool(req.body.isOrganizer),
                isPresenter: toBool(req.body.isPresenter),
                isSponsor: toBool(req.body.isSponsor),
            },
            loginPin
        );

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

/* PUT /:id — update existing registration */
router.put("/:id", requirePin, ownerOnly, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        sendError(res, 400, "Invalid ID", { raw: req.params.id });
        return;
    }

    // Validate phones ONLY if provided and non-empty
    if (!isValidPhone(req.body.phone1) || !isValidPhone(req.body.phone2)) {
        sendError(res, 400, "Invalid phone number(s)", {
            phone1: req.body.phone1,
            phone2: req.body.phone2,
        });
        return;
    }

    try {
        const updateValues = {
            email: req.body.email ? String(req.body.email).trim().toLowerCase() : undefined,
            phone1: toNull(req.body.phone1),
            phone2: toNull(req.body.phone2),
            firstName: req.body.firstName !== undefined ? toNull(req.body.firstName) : undefined,
            lastName: req.body.lastName !== undefined ? String(req.body.lastName).trim() : undefined,
            namePrefix: req.body.namePrefix !== undefined ? toNull(req.body.namePrefix) : undefined,
            nameSuffix: req.body.nameSuffix !== undefined ? toNull(req.body.nameSuffix) : undefined,
            hasProxy: req.body.hasProxy !== undefined ? toBool(req.body.hasProxy) : undefined,
            proxyName: req.body.proxyName !== undefined ? toNull(req.body.proxyName) : undefined,
            proxyPhone: req.body.proxyPhone !== undefined ? toNull(req.body.proxyPhone) : undefined,
            proxyEmail:
                req.body.proxyEmail !== undefined
                    ? toNull(req.body.proxyEmail ? String(req.body.proxyEmail).toLowerCase() : null)
                    : undefined,
            cancelledAttendance:
                req.body.cancelledAttendance !== undefined ? toBool(req.body.cancelledAttendance) : undefined,
            cancellationReason:
                req.body.cancellationReason !== undefined ? toNull(req.body.cancellationReason) : undefined,
            day1Attendee: req.body.day1Attendee !== undefined ? toBool(req.body.day1Attendee) : undefined,
            day2Attendee: req.body.day2Attendee !== undefined ? toBool(req.body.day2Attendee) : undefined,
            question1: req.body.question1 !== undefined ? String(req.body.question1).trim() : undefined,
            question2: req.body.question2 !== undefined ? String(req.body.question2).trim() : undefined,
            // Don't force isAttendee=true on update; preserve/allow explicit changes
            isAttendee: req.body.isAttendee !== undefined ? toBool(req.body.isAttendee) : undefined,
            isCancelled: req.body.isCancelled !== undefined ? toBool(req.body.isCancelled) : undefined,
            isMonitor: req.body.isMonitor !== undefined ? toBool(req.body.isMonitor) : undefined,
            isOrganizer: req.body.isOrganizer !== undefined ? toBool(req.body.isOrganizer) : undefined,
            isPresenter: req.body.isPresenter !== undefined ? toBool(req.body.isPresenter) : undefined,
            isSponsor: req.body.isSponsor !== undefined ? toBool(req.body.isSponsor) : undefined,
        } as const;

        // Remove undefined keys so we only update what was provided
        const clean: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updateValues)) {
            if (v !== undefined) clean[k] = v;
        }

        const result = await updateRegistration(id, clean);

        if ((result as unknown as { affectedRows?: number }).affectedRows === 0) {
            sendError(res, 404, "Registration not found", { id });
            return;
        }

        // Return the updated record (including loginPin for convenience)
        const [record] = await getRegistrationWithPinById(id);

        if (!record?.registrations) {
            sendError(res, 404, "Registration not found", { id });
            return;
        }

        log.info("Registration updated", {
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
        log.error("Failed to update registration", {
            registrationId: id,
            cause: err instanceof Error ? err.message : String(err),
            body: redact(req.body),
        });
        sendError(res, 500, "Failed to update registration", {
            id,
            cause: err instanceof Error ? err.message : String(err),
        });
    }
});

/* POST /login */
router.post("/login", async (req, res): Promise<void> => {
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : undefined;
    const pin = req.body?.pin ? String(req.body.pin).trim() : undefined;

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
        const [record] = await getRegistrationWithPinByLogin(email, pin);

        if (!record?.registrations) {
            log.warn("Registration lookup: not found", { email, registrationId: undefined });
            sendError(res, 404, "Registration not found", { email });
            return;
        }

        log.info("Login successful", {
            email,
            registrationId: record.registrations.id,
        });
        const csrf = createSession(res, record.registrations.id);
        res.json({
            registration: {
                ...record.registrations,
                loginPin: record.credentials.loginPin,
            },
            csrf,
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
        const [registration] = await getRegistrationByEmail(email);

        if (!registration) {
            log.warn("Lost PIN: registration not found", { email, registrationId: undefined });
            sendError(res, 404, "Please contact PCATT", { email });
            return;
        }

        const [credential] = await getCredentialByRegId(registration.id);

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
router.get<{ id: string }, any>("/:id", requirePin, ownerOnly, async (req, res): Promise<void> => {
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
        const [record] = await getRegistrationWithPinById(id);

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
    sendError(res, 404, req.method === "POST" ? ROUTE_NOT_FOUND : "Not found", {
        method: req.method,
        path: req.originalUrl,
    });
});

export default router;
