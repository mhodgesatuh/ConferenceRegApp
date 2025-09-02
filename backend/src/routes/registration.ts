// backend/src/routes/registration.ts

import { NextFunction, Request, Response, Router } from "express";
import { log, sendError } from "@/utils/logger";
import { createSession, requireAuth } from "@/utils/auth";
import { isDuplicateKey } from "@/utils/dbErrors";
import { logDbError } from "@/utils/dbErrorLogger";
import { requirePin } from "@/middleware/requirePin";
import { verifyCsrf } from "@/middleware/verifyCsrf";
import {
    generatePin,
    hasInvalidPhones,
    missingRequiredFields,
    toNull,
    toTinyInt,
    isValidEmail,
} from "./registration.utils";
import {
    createRegistration,
    sendLostPinEmail,
    getRegistrationWithPinById,
    getRegistrationWithPinByLogin,
    updateRegistration,
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
    proxyEmail?: string;
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
const REGISTRATION_NOT_FOUND = "Registration not found";
const FAILED_TO_FETCH_REGISTRATION = "Failed to fetch registration";
const CONTACT_US = "Please contact us";

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
    const authId = Number((req as any).registrationId);  // <- changed
    if (!authId || Number.isNaN(authId) || authId !== regId) {
        sendError(res, 403, "Unauthorized", { id: regId });
        return;
    }
    next();
}


/* POST / */
router.post("/", async (req, res): Promise<void> => {    if (req.body?.id) {
        sendError(res, 405, "Use PUT /:id to update an existing registration");
        return;
    }

    const missing = missingRequiredFields(req.body);
    if (missing.length) {
        sendError(res, 400, "Missing required information", { missing });
        return;
    }

    // email is guaranteed by the required-fields guard above
    const email: string = String(req.body.email).trim().toLowerCase();

    // Basic email format check (lightweight)
    if (!isValidEmail(email)) {
        sendError(res, 400, "Invalid email address", { email });
        return;
    }

    // Validate phones before any DB work
    if (hasInvalidPhones(req.body)) {
        sendError(res, 400, "Invalid phone number(s)", {
            phone1: req.body.phone1,
            phone2: req.body.phone2,
        });
        return;
    }

    try {
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
                hasProxy: toTinyInt(req.body.hasProxy),
                proxyName: toNull(req.body.proxyName),
                proxyPhone: toNull(req.body.proxyPhone),
                proxyEmail: toNull(req.body.proxyEmail ? String(req.body.proxyEmail).toLowerCase() : null),
                cancelledAttendance: toTinyInt(req.body.cancelledAttendance),
                cancellationReason: toNull(req.body.cancellationReason),
                day1Attendee: toTinyInt(req.body.day1Attendee),
                day2Attendee: toTinyInt(req.body.day2Attendee),
                question1: String(req.body.question1).trim(),
                question2: String(req.body.question2).trim(),
                isAttendee: 1, // always true on create
                isCancelled: toTinyInt(req.body.isCancelled),
                isMonitor: toTinyInt(req.body.isMonitor),
                isOrganizer: toTinyInt(req.body.isOrganizer),
                isPresenter: toTinyInt(req.body.isPresenter),
                isSponsor: toTinyInt(req.body.isSponsor),
            },
            loginPin
        );

        log.info("Registration created", { email, registrationId: id });
        res.status(201).json({ id, loginPin });
    } catch (err) {
        if (isDuplicateKey(err)) {
            sendError(res, 409, "Registration already exists", { email });
            return;
        }

        logDbError(log, err, {
            message: SAVE_REGISTRATION_ERROR,
            email,
            body: redact(req.body),
        });
        sendError(res, 500, SAVE_REGISTRATION_ERROR);
    }
});

/* PUT /:id — update existing registration */
router.put("/:id", requireAuth, ownerOnly, verifyCsrf, async (req, res): Promise<void> => {    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        sendError(res, 400, "Invalid ID", { raw: req.params.id });
        return;
    }

    if (hasInvalidPhones(req.body)) {
        sendError(res, 400, "Invalid phone number(s)", {
            phone1: req.body.phone1,
            phone2: req.body.phone2,
        });
        return;
    }

    const missing = missingRequiredFields(req.body, true);
    if (missing.length) {
        sendError(res, 400, "Missing required information", { missing });
        return;
    }

    // Coerce & validate email only if provided for partial updates
    const email: string | undefined = req.body.email
        ? String(req.body.email).trim().toLowerCase()
        : undefined;
    if (email !== undefined && !isValidEmail(email)) {
        sendError(res, 400, "Invalid email address", { email });
        return;
    }

    try {
        const updateValues = {
            email, // only set if provided
            phone1: req.body.phone1 !== undefined ? toNull(req.body.phone1) : undefined,
            phone2: req.body.phone2 !== undefined ? toNull(req.body.phone2) : undefined,
            firstName: req.body.firstName !== undefined ? toNull(req.body.firstName) : undefined,
            lastName: req.body.lastName !== undefined ? String(req.body.lastName).trim() : undefined, // do not lowercase
            namePrefix: req.body.namePrefix !== undefined ? toNull(req.body.namePrefix) : undefined,
            nameSuffix: req.body.nameSuffix !== undefined ? toNull(req.body.nameSuffix) : undefined,
            hasProxy: req.body.hasProxy !== undefined ? toTinyInt(req.body.hasProxy) : undefined,
            proxyName: req.body.proxyName !== undefined ? toNull(req.body.proxyName) : undefined,
            proxyPhone: req.body.proxyPhone !== undefined ? toNull(req.body.proxyPhone) : undefined,
            proxyEmail:
                req.body.proxyEmail !== undefined
                    ? toNull(req.body.proxyEmail ? String(req.body.proxyEmail).toLowerCase() : null)
                    : undefined,
            cancelledAttendance:
                req.body.cancelledAttendance !== undefined ? toTinyInt(req.body.cancelledAttendance) : undefined,
            cancellationReason:
                req.body.cancellationReason !== undefined ? toNull(req.body.cancellationReason) : undefined,
            day1Attendee: req.body.day1Attendee !== undefined ? toTinyInt(req.body.day1Attendee) : undefined,
            day2Attendee: req.body.day2Attendee !== undefined ? toTinyInt(req.body.day2Attendee) : undefined,
            question1: req.body.question1 !== undefined ? String(req.body.question1).trim() : undefined,
            question2: req.body.question2 !== undefined ? String(req.body.question2).trim() : undefined,
            // Don't force isAttendee=true on update; preserve/allow explicit changes
            isAttendee: req.body.isAttendee !== undefined ? toTinyInt(req.body.isAttendee) : undefined,
            isCancelled: req.body.isCancelled !== undefined ? toTinyInt(req.body.isCancelled) : undefined,
            isMonitor: req.body.isMonitor !== undefined ? toTinyInt(req.body.isMonitor) : undefined,
            isOrganizer: req.body.isOrganizer !== undefined ? toTinyInt(req.body.isOrganizer) : undefined,
            isPresenter: req.body.isPresenter !== undefined ? toTinyInt(req.body.isPresenter) : undefined,
            isSponsor: req.body.isSponsor !== undefined ? toTinyInt(req.body.isSponsor) : undefined,
        } as const;

        // Remove undefined keys so we only update what was provided
        const clean: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updateValues)) {
            if (v !== undefined) clean[k] = v;
        }

        if (Object.keys(clean).length === 0) {
            sendError(res, 400, "No fields to update");
            return;
        }

        const { rowsAffected } = await updateRegistration(id, clean);
        if (!rowsAffected) {
            sendError(res, 404, REGISTRATION_NOT_FOUND, { id });
            return;
        }

        // Return the updated record (including loginPin for convenience)
        const [record] = await getRegistrationWithPinById(id);

        if (!record?.registrations) {
            sendError(res, 404, REGISTRATION_NOT_FOUND, { id });
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
        if (isDuplicateKey(err)) {
            sendError(res, 409, "Registration already exists", { email });
            return;
        }
        logDbError(log, err, {
            message: SAVE_REGISTRATION_ERROR,
            email,
            body: redact(req.body),
        });
        sendError(res, 500, SAVE_REGISTRATION_ERROR);
    }
});

/* POST /login (no CSRF on first login) */
router.post("/login", async (req, res): Promise<void> => {

    const pin = String(req.body?.pin ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();

    if (!email || !pin) {
        log.warn("Login failed: missing credentials", {
            email,
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
            log.warn("Registration lookup: not found", { email });
            sendError(res, 404, REGISTRATION_NOT_FOUND, { email });
            return;
        }

        log.info("Login successful", {
            email,
            registrationId: record.registrations.id,
        });
        const csrf = createSession(res, record.registrations.id);
        res.json({
            registration: record.registrations, // do not return loginPin,
            csrf,
        });
    } catch (err) {
        logDbError(log, err, {
            message: FAILED_TO_FETCH_REGISTRATION,
            email,
            body: redact(req.body),
        });
        sendError(res, 500, FAILED_TO_FETCH_REGISTRATION);
    }
});

/* GET /lost-pin?email=addr */
router.get("/lost-pin", async (req, res): Promise<void> => {
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;
    if (!email) {
        sendError(res, 400, "Email required");
        return;
    }

    try {
        const result = await sendLostPinEmail(email);
        if (!result.ok) {
            const payload = { email };
            const msg = result.code === "not_found_registration" ? CONTACT_US : CONTACT_US;
            sendError(res, 404, msg, payload);
            return;
        }
        log.info("Sending PIN", { email });
        res.json({ sent: true });
    } catch (err) {
        logDbError(log, err, { message: "Failed to send PIN", email });
        sendError(res, 500, "Failed to send PIN");
    }
});

/* GET /:id */
router.get<{ id: string }, any>("/:id", requirePin, ownerOnly, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        log.warn("Fetch by id: invalid id", {
            email: undefined,
            rawId: req.params.id,
        });
        sendError(res, 400, "Invalid ID", { raw: req.params.id });
        return;
    }

    try {
        const [record] = await getRegistrationWithPinById(id);

        if (!record?.registrations) {
            log.warn(REGISTRATION_NOT_FOUND, { email: undefined, registrationId: id });
            sendError(res, 404, REGISTRATION_NOT_FOUND, { id });
            return;
        }

        log.info("Registration found", {
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
        logDbError(log, err, {
            message: FAILED_TO_FETCH_REGISTRATION,
            email: undefined,
            registrationId: id,
        });
        // Do not expose internal error details to the client
        sendError(res, 500, FAILED_TO_FETCH_REGISTRATION);
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
