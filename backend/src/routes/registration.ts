import {Router} from 'express';
import {db} from '@/db/client';
import {credentials, registrations} from '@/db/schema';

import {and, eq} from 'drizzle-orm';
import {log} from "@/utils/logger";

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
    let pin = '';
    for (let i = 0; i < length; i++) {
        pin += Math.floor(Math.random() * 10).toString();
    }
    return pin;
}

const router = Router();

/* POST / */
router.post<{}, any, CreateRegistrationBody>(
    '/',
    async (req, res): Promise<void> => {
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

            if (!email || !lastName || !proxyEmail || !question1 || !question2) {
                res.status(400).json({error: 'Missing required information'});
                return;
            }

            const loginPin = generatePin(8);

            const [{id}] = await db
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

            res.status(201).json({id, loginPin});
        } catch (err) {
            log.error('Error saving registration', {error: err});
            res.status(500).json({error: 'Failed to save registration'});
        }
    }
);

/* GET /login?email=addr&pin=code */
router.get(
    '/login',
    async (req, res): Promise<void> => {
        const {email, pin} = req.query as { email?: string; pin?: string };

        if (!email || !pin) {
            res.status(400).json({error: 'Missing credentials'});
            return;
        }

        try {
            const [record] = await db
                .select()
                .from(registrations)
                .innerJoin(
                    credentials,
                    eq(credentials.registrationId, registrations.id)
                )
                .where(
                    and(
                        eq(registrations.email, email),
                        eq(credentials.loginPin, pin)
                    )
                );

            const registration =
                record && record.registrations
                    ? {
                        ...record.registrations,
                        loginPin: record.credentials.loginPin,
                    }
                    : undefined;

            if (!registration) {
                res.status(404).json({error: 'Registration not found'});
                return;
            }

            res.json({registration});
        } catch (err) {
            log.error('Error fetching registration', {error: err});
            res.status(500).json({error: 'Failed to fetch registration'});
        }
    }
);

/* GET /lost-pin?email=addr */
router.get(
    '/lost-pin',
    async (req, res): Promise<void> => {
        const {email} = req.query as { email?: string };

        if (!email) {
            res.status(400).json({error: 'Email required'});
            return;
        }

        try {
            const [registration] = await db
                .select()
                .from(registrations)
                .where(eq(registrations.email, email));

            if (!registration) {
                res.status(404).json({error: 'Please contact PCATT'});
                return;
            }

            const [credential] = await db
                .select()
                .from(credentials)
                .where(eq(credentials.registrationId, registration.id));

            if (!credential) {
                res.status(404).json({error: 'Please contact PCATT'});
                return;
            }

            // In a real implementation, send the pin via email here.
            log.info(`Sending pin ${credential.loginPin} to ${email}`);

            res.json({sent: true});
        } catch (err) {
            log.error('Error sending pin', {error: err});
            res.status(500).json({error: 'Failed to send pin'});
        }
    }
);

/* GET /:id */
router.get<{ id: string }, any>(
    '/:id',
    async (req, res): Promise<void> => {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({error: 'Invalid ID'});
            return;
        }

        try {
            const [record] = await db
                .select()
                .from(registrations)
                .innerJoin(
                    credentials,
                    eq(credentials.registrationId, registrations.id)
                )
                .where(eq(registrations.id, id));

            const registration =
                record && record.registrations
                    ? {
                        ...record.registrations,
                        loginPin: record.credentials.loginPin,
                    }

                    : undefined;

            if (!registration) {
                res.status(404).json({error: 'Registration not found'});
                return;
            }

            res.json({registration});
        } catch (err) {
            log.error('Error fetching registration', {error: err});
            res.status(500).json({error: 'Failed to fetch registration'});
        }
    }
);

export default router;
