// backend/src/routes/registration.ts
//

import { Router } from "express";
import { db } from "@/db/client";
import { credentials, registrations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { log, sendError } from "@/utils/logger";

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

// Columns marked as NOT NULL in the database schema. These need to be
// present before attempting to insert a record.
const REQUIRED_FIELDS: (keyof CreateRegistrationBody)[] = [
    "email",
    "lastName",
    "proxyEmail",
    "question1",
    "question2",
];

/* POST / */
router.post<{}, any, CreateRegistrationBody>("/", async (req, res): Promise<void> => {
    try {
        const {
            email,
            phone1,
            phone2,
            firstName,
            lastName,
            namePrefix,
            nameSuffix,
            hasProxy,
            proxyName,
            proxyPhone,
            proxyEmail,
            cancelledAttendance,
            cancellationReason,
            day1Attendee,
            day2Attendee,
            question1,
            question2,
            isCancelled,
            isAttendee,
            isMonitor,
            isOrganizer,
            isPresenter,
            isSponsor,
        } = req.body;

        const missing = REQUIRED_FIELDS.filter((field) => !req.body[field]);
        if (missing.length) {
            sendError(res, 400, "Missing required information", { missing });
            return;
        }

        const loginPin = generatePin(8);

        const [{ id }] = await db
            .insert(registrations)
            .values({
                email,
                phone1,
                phone2,
                firstName,
                lastName,
                namePrefix,
                nameSuffix,
                hasProxy,
                proxyName,
                proxyPhone,
                proxyEmail,
                cancelledAttendance,
                cancellationReason,
                day1Attendee,
                day2Attendee,
                question1,
                question2,
                isAttendee,
                isCancelled,
                isMonitor,
                isOrganizer,
                isPresenter,
                isSponsor,
            })
            .$returningId();

        await db.insert(credentials).values({
            registrationId: id,
            loginPin,
        });

        log.info("Registration created", { id, email });
        res.status(201).json({ id, loginPin });
    } catch (err) {
        sendError(res, 500, "Failed to save registration", {
            cause: err instanceof Error ? err.message : String(err),
        });
    }
});

/* GET /login?email=addr&pin=code */
router.get("/login", async (req, res): Promise<void> => {
    const { email, pin } = req.query as { email?: string; pin?: string };

    if (!email || !pin) {
        sendError(res, 400, "Missing credentials", { emailProvided: !!email, pinProvided: !!pin });
        return;
    }

    try {
        const [record] = await db
            .select()
            .from(registrations)
            .innerJoin(credentials, eq(credentials.registrationId, registrations.id))
            .where(and(eq(registrations.email, email), eq(credentials.loginPin, pin)));

        const registration =
            record && record.registrations
                ? {
                    ...record.registrations,
                    loginPin: record.credentials.loginPin,
                }
                : undefined;

        if (!registration) {
            sendError(res, 404, "Registration not found", { email });
            return;
        }

        log.info("Registration lookup successful", { email });
        res.json({ registration });
    } catch (err) {
        sendError(res, 500, "Failed to fetch registration", {
            email,
            cause: err instanceof Error ? err.message : String(err),
        });
    }
});

/* GET /lost-pin?email=addr */
router.get("/lost-pin", async (req, res): Promise<void> => {
    const { email } = req.query as { email?: string };

    if (!email) {
        sendError(res, 400, "Email required");
        return;
    }

    try {
        const [registration] = await db.select().from(registrations).where(eq(registrations.email, email));

        if (!registration) {
            sendError(res, 404, "Please contact PCATT", { email });
            return;
        }

        const [credential] = await db
            .select()
            .from(credentials)
            .where(eq(credentials.registrationId, registration.id));

        if (!credential) {
            sendError(res, 404, "Please contact PCATT", { email, registrationId: registration.id });
            return;
        }

        // In a real implementation, send the pin via email here.
        // (Consider not logging the actual pin in production logs.)
        log.info("Sending pin", { email /*, pin: credential.loginPin */ });

        res.json({ sent: true });
    } catch (err) {
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
        sendError(res, 400, "Invalid ID", { raw: req.params.id });
        return;
    }

    try {
        const [record] = await db
            .select()
            .from(registrations)
            .innerJoin(credentials, eq(credentials.registrationId, registrations.id))
            .where(eq(registrations.id, id));

        const registration =
            record && record.registrations
                ? {
                    ...record.registrations,
                    loginPin: record.credentials.loginPin,
                }
                : undefined;

        if (!registration) {
            sendError(res, 404, "Registration not found", { id });
            return;
        }

        log.info("Registration fetched", { id });
        res.json({ registration });
    } catch (err) {
        sendError(res, 500, "Failed to fetch registration", {
            id,
            cause: err instanceof Error ? err.message : String(err),
        });
    }
});

export default router;
