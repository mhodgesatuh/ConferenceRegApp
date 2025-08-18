// backend/src/routes/registration.ts

import {Router} from "express";
import {db} from "@/db/client";
import {credentials, registrations} from "@/db/schema";
import {and, eq} from "drizzle-orm";
import {log, sendError} from "@/utils/logger";

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
    const clone = {...body};
    (["loginPin", "pin", "password"] as const).forEach((k) => {
        // @ts-expect-error – dynamic cleanup
        if (k in clone) clone[k] = "<redacted>";
    });
    return clone;
}

/* POST / */
router.post<{}, any, CreateRegistrationBody>("/", async (req, res): Promise<void> => {
    const email = req.body?.email?.trim().toLowerCase();

    try {
        const missing = REQUIRED_FIELDS.filter((field) => !req.body[field]);
        if (missing.length) {
            sendError(res, 400, "Missing required information", {missing});
            return;
        }

        const loginPin = generatePin(8);

        // Save registration + credential in a single transaction
        const {id} = await db.transaction<{ id: number }>(async (tx) => {
            const result = await tx.insert(registrations).values({
                email,
                phone1: req.body.phone1,
                phone2: req.body.phone2,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                namePrefix: req.body.namePrefix,
                nameSuffix: req.body.nameSuffix,
                hasProxy: req.body.hasProxy,
                proxyName: req.body.proxyName,
                proxyPhone: req.body.proxyPhone,
                proxyEmail: req.body.proxyEmail,
                cancelledAttendance: req.body.cancelledAttendance,
                cancellationReason: req.body.cancellationReason,
                day1Attendee: req.body.day1Attendee,
                day2Attendee: req.body.day2Attendee,
                question1: req.body.question1,
                question2: req.body.question2,
                isAttendee: req.body.isAttendee,
                isCancelled: req.body.isCancelled,
                isMonitor: req.body.isMonitor,
                isOrganizer: req.body.isOrganizer,
                isPresenter: req.body.isPresenter,
                isSponsor: req.body.isSponsor,
            });

            // MariaDB/MySQL: auto-increment PK is available as insertId
            const newId = Number((result as any)?.insertId);
            if (!newId) throw new Error("Insert did not return insertId");

            await tx.insert(credentials).values({registrationId: newId, loginPin});

            return {id: newId};
        });

        log.info("Registration created", {email, registrationId: id});
        res.status(201).json({id, loginPin});
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
    const {email, pin} = req.query as { email?: string; pin?: string };

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
            log.warn("Registration lookup: not found", {email, registrationId: undefined});
            sendError(res, 404, "Registration not found", {email});
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
    const {email} = req.query as { email?: string };

    if (!email) {
        log.warn("Lost PIN: email required", {
            email: undefined,
            registrationId: undefined,
        });
        sendError(res, 400, "Email required");
        return;
    }

    try {
        const [registration] = await db.select().from(registrations).where(eq(registrations.email, email));

        if (!registration) {
            log.warn("Lost PIN: registration not found", {email, registrationId: undefined});
            sendError(res, 404, "Please contact PCATT", {email});
            return;
        }

        const [credential] = await db
            .select()
            .from(credentials)
            .where(eq(credentials.registrationId, registration.id));

        if (!credential) {
            log.warn("Lost PIN: credential not found", {email, registrationId: registration.id});
            sendError(res, 404, "Please contact PCATT", {email, registrationId: registration.id});
            return;
        }

        // TODO: send email/SMS with credential.loginPin
        log.info("Sending pin", {email, registrationId: registration.id});
        res.json({sent: true});
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
        sendError(res, 400, "Invalid ID", {raw: req.params.id});
        return;
    }

    try {
        const [record] = await db
            .select()
            .from(registrations)
            .innerJoin(credentials, eq(credentials.registrationId, registrations.id))
            .where(eq(registrations.id, id));

        if (!record?.registrations) {
            log.warn("Fetch by id: not found", {email: undefined, registrationId: id});
            sendError(res, 404, "Registration not found", {id});
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
    log.warn(ROUTE_NOT_FOUND, {method: req.method, path: req.originalUrl});
    sendError(res, 404, req.method === "POST" ? ROUTE_NOT_FOUND : "Not found", {
        method: req.method,
        path: req.originalUrl,
    });
});

export default router;
