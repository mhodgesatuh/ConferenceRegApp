// backend/src/routes/registration.ts
//
// Express router for registration-related API endpoints.
// - Configures CSRF using cookie-based secrets (csrfProtection, csrfLogin) with strict, httpOnly cookie options.
// - Sets rate limiters for login, create, and lost-pin endpoints to mitigate abuse.
// - Defines helpers and guards:
//   - redact(...) removes sensitive fields (e.g., PIN) from logs.
//   - ownerOnly ensures only the registration owner (or organizer) can access/modify a record.
//   - organizerOnly restricts certain routes to organizer role.
// - POST / (public create; CSRF-exempt):
//   - Validates input (required fields, email/phones), generates an 8-digit PIN, inserts the registration.
//   - Immediately creates a session (createSession) so the client can prime CSRF next.
//   - Returns { id, loginPin } with 201 Created.
// - PUT /:id (write):
//   - Protected by requireAuth, csrfProtection, and ownerOnly.
//   - Sanitizes disallowed fields (removes client-provided loginPin), validates, applies partial update.
//   - Fetches and returns the current record without exposing the login PIN.
//   - GET / (list): Admin-only listing protected by requireAuth + organizerOnly.
// - POST /login (public):
//   - Rate-limited; verifies email+PIN, creates a session, returns { registration, csrf, csrfHeader }.
//   - Uses csrfLogin to allow POST while still issuing a CSRF token afterward.
// - GET /lost-pin (public): Rate-limited endpoint to trigger a PIN recovery email; returns { sent: true } on success.
// - GET /:id (read): Protected by requireAuth + ownerOnly; returns the registration without the login PIN.
// - GET /csrf (auth): Returns a fresh CSRF token and the header name to use, bound to the current session.
// - Catch-all 404: Warns and returns appropriate 404 for unknown routes under this router.
//

import {type CookieOptions, NextFunction, Request, Response, Router} from "express";
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import {CSRF_HEADER} from "@/constants/security";
import {log, sendError} from "@/utils/logger";
import {createSession, getSession, requireAuth} from "@/utils/auth";
import {isDuplicateKey} from "@/utils/dbErrors";
import {logDbError} from "@/utils/dbErrorLogger";
import {
    generatePin,
    hasInvalidPhones,
    isValidEmail,
    missingRequiredFields,
    REQUIRED_FIELDS,
    toBool,
    toNull,
    toTinyInt,
} from "./registration.utils";
import {
    createRegistration,
    getAllRegistrations,
    getRegistrationWithPinById,
    getRegistrationWithPinByLogin,
    sendLostPinEmail,
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
    presenterBio?: string;
    presenterPicUrl?: string;
    isAttendee?: boolean;
    isCancelled?: boolean;
    isMonitor?: boolean;
    isOrganizer?: boolean;
    isPresenter?: boolean;
    isSponsor?: boolean;
}

const router = Router();

/** Typed cookie options for csurf */
const csrfCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 1h; match your session lifetime if possible
};

const csrfProtection = csrf({ cookie: csrfCookieOptions });
const csrfLogin = csrf({ cookie: csrfCookieOptions, ignoreMethods: ["POST"] });
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        const email = (req.body?.email ?? "").toString().trim().toLowerCase();
        return `${email}|${req.ip}`;
    },
});
const createLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false
});
const lostPinLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false
});

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
    const authId = Number(req.registrationId);
    const isOrg = Boolean((req as any).isOrganizer);
    if (!authId || Number.isNaN(authId) || (authId !== regId && !isOrg)) {
        sendError(res, 403, "Unauthorized", { id: regId });
        return;
    }
    next();
}

function organizerOnly(req: Request, res: Response, next: NextFunction) {
    if (!(req as any).isOrganizer) {
        sendError(res, 403, "Unauthorized");
        return;
    }
    next();
}


/* POST / (public create; CSRF-exempt) */
router.post("/", createLimiter, async (req: Request, res: Response): Promise<void> => {
    if (req.body?.id) {
        sendError(res, 405, "Use PUT /:id to update an existing registration");
        return;
    }

    const missing = missingRequiredFields(req.body, false, REQUIRED_FIELDS);
    const needsPresenterInfo = toBool(req.body.isPresenter);
    const presenterMissing: string[] = [];
    if (needsPresenterInfo) {
        if (!req.body.presenterBio || String(req.body.presenterBio).trim() === "") {
            presenterMissing.push("presenterBio");
        }
        if (!req.body.presenterPicUrl || String(req.body.presenterPicUrl).trim() === "") {
            presenterMissing.push("presenterPicUrl");
        }
    }

    const missingAll = [...missing, ...presenterMissing];
    if (missingAll.length) {
        sendError(res, 400, "Missing required information", { missing: Array.from(new Set(missingAll)) });
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
        const existingSession = getSession(req);
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
                lunchMenu: toNull(req.body.lunchMenu),
                question1: String(req.body.question1).trim(),
                question2: String(req.body.question2).trim(),
                presenterBio: toNull(req.body.presenterBio),
                presenterPicUrl: toNull(req.body.presenterPicUrl),
                session1Title: toNull(req.body.session1Title),
                session1Description: toNull(req.body.session1Description),
                isSecondSession: toTinyInt(req.body.isSecondSession),
                session2Title: toNull(req.body.session2Title),
                session2Description: toNull(req.body.session2Description),
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

        // Establish a session and immediately fetch a CSRF token
        if (!existingSession) {
            createSession(res, id, /* isOrganizer */ false);
        }
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

/* PUT /:id (auth + CSRF; write) */
router.put("/:id", requireAuth, csrfProtection, ownerOnly,
    async (req: Request, res: Response): Promise<void> => {

        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            sendError(res, 400, "Invalid ID", { raw: req.params.id });
            return;
        }

        // Never accept client-provided PIN on update
        if (req.body && 'loginPin' in req.body) {
            delete (req.body as any).loginPin;
        }

        if (hasInvalidPhones(req.body)) {
            sendError(res, 400, "Invalid phone number(s)", {
                phone1: req.body.phone1,
                phone2: req.body.phone2,
            });
            return;
        }

        const missing = missingRequiredFields(req.body, true, REQUIRED_FIELDS);
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
            const [existingRecord] = await getRegistrationWithPinById(id);

            if (!existingRecord?.registrations) {
                sendError(res, 404, REGISTRATION_NOT_FOUND, { id });
                return;
            }

            const current = existingRecord.registrations;
            const targetIsPresenter =
                req.body.isPresenter !== undefined
                    ? toBool(req.body.isPresenter)
                    : Boolean(current.isPresenter);

            if (targetIsPresenter) {
                const presenterMissing: string[] = [];
                const nextBio =
                    req.body.presenterBio !== undefined ? req.body.presenterBio : current.presenterBio;
                const nextPic =
                    req.body.presenterPicUrl !== undefined ? req.body.presenterPicUrl : current.presenterPicUrl;

                if (!nextBio || String(nextBio).trim() === "") presenterMissing.push("presenterBio");
                if (!nextPic || String(nextPic).trim() === "") presenterMissing.push("presenterPicUrl");

                if (presenterMissing.length) {
                    sendError(res, 400, "Missing required information", { missing: presenterMissing });
                    return;
                }
            }

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
                lunchMenu: req.body.lunchMenu !== undefined ? toNull(req.body.lunchMenu) : undefined,
                question1: req.body.question1 !== undefined ? String(req.body.question1).trim() : undefined,
                question2: req.body.question2 !== undefined ? String(req.body.question2).trim() : undefined,
                presenterBio: req.body.presenterBio !== undefined ? toNull(req.body.presenterBio) : undefined,
                presenterPicUrl: req.body.presenterPicUrl !== undefined ? toNull(req.body.presenterPicUrl) : undefined,
                session1Title: req.body.session1Title !== undefined ? toNull(req.body.session1Title) : undefined,
                session1Description:
                    req.body.session1Description !== undefined ? toNull(req.body.session1Description) : undefined,
                isSecondSession:
                    req.body.isSecondSession !== undefined ? toTinyInt(req.body.isSecondSession) : undefined,
                session2Title: req.body.session2Title !== undefined ? toNull(req.body.session2Title) : undefined,
                session2Description:
                    req.body.session2Description !== undefined ? toNull(req.body.session2Description) : undefined,
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

            // Perform the update
            const { rowsAffected } = await updateRegistration(id, clean);

            // Always fetch after attempting the update — 0 rowsAffected may mean "unchanged"
            const [record] = await getRegistrationWithPinById(id);

            if (!record?.registrations) {
                // truly not found
                sendError(res, 404, REGISTRATION_NOT_FOUND, { id, rowsAffected });
                return;
            }

            // success: even if no fields changed, return the current record
            log.info("Registration updated", {
                registrationId: id,
                rowsAffected: rowsAffected ?? 0,
            });

            res.json({
                registration: record.registrations,
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

/* GET / (auth, administration only) - list registrations */
router.get("/", requireAuth, organizerOnly, async (_req: Request, res: Response): Promise<void> => {
    try {
        const rows = await getAllRegistrations();
        res.json({ registrations: rows });
    } catch (err) {
        logDbError(log, err, { message: FAILED_TO_FETCH_REGISTRATION });
        sendError(res, 500, FAILED_TO_FETCH_REGISTRATION);
    }
});

/* POST /login (public) -> sets cookie, returns csrf */
router.post("/login", loginLimiter, csrfLogin,
    async (req: Request, res: Response): Promise<void> => {

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
            createSession(res, record.registrations.id, !!record.registrations.isOrganizer);
            const csrf = req.csrfToken();
            res.json({
                registration: record.registrations, // do not return loginPin,
                csrf,                               // token value
                csrfHeader: CSRF_HEADER,            // header name to send it in
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
router.get("/lost-pin", lostPinLimiter, async (req: Request, res: Response): Promise<void> => {
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;
    if (!email) {
        sendError(res, 400, "Email required");
        return;
    }

    try {
        const result = await sendLostPinEmail(email);
        if (!result.ok) {
            const payload = { email };
            sendError(res, 404, CONTACT_US, payload);
            return;
        }
        log.info("Sending PIN", { email });
        res.json({ sent: true });
    } catch (err) {
        logDbError(log, err, { message: "Failed to send PIN", email });
        sendError(res, 500, "Failed to send PIN");
    }
});

/* GET /:id (auth; no CSRF for read) */
router.get<{ id: string }>("/:id", requireAuth, ownerOnly,
    async (req: Request, res: Response): Promise<void> => {
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
                registration: record.registrations,
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

/* GET /csrf (auth) -> issue a CSRF token bound to the current session */
router.get("/csrf", requireAuth, csrfProtection, (req: Request, res: Response) => {
    res.json({
        csrf: req.csrfToken(),   // token value
        csrfHeader: CSRF_HEADER, // header name your client should use
    });
});


// --- Router-level 404 (must be last) ---
router.all("*", (req: Request, res: Response) => {
    const ROUTE_NOT_FOUND = "Internal error: route not found";
    log.warn(ROUTE_NOT_FOUND, { method: req.method, path: req.originalUrl });
    sendError(res, 404, req.method === "POST" ? ROUTE_NOT_FOUND : "Not found", {
        method: req.method,
        path: req.originalUrl,
    });
});

export default router;
