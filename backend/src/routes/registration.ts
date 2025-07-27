import { Router } from 'express';
import { db } from '../db/client';
import { registrations, credentials } from '../db/schema';
import { eq, and } from 'drizzle-orm';

interface CreateRegistrationBody {
    id?: number;
    email: string;
    loginPin: string;
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
    day1Attendee?: boolean;
    day2Attendee?: boolean;
    question1: string;
    question2: string;
    isAttendee?: boolean;
    isMonitor?: boolean;
    isOrganizer?: boolean;
    isPresenter?: boolean;
    isSponsor?: boolean;
}

const router = Router();

/* POST / */
router.post<{}, any, CreateRegistrationBody>(
    '/',
    async (req, res): Promise<void> => {
        try {
            const {
                email,
                loginPin,
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
                day1Attendee,
                day2Attendee,
                question1,
                question2,
                isAttendee,
                isMonitor,
                isOrganizer,
                isPresenter,
                isSponsor,
            } = req.body;

            if (!email || !loginPin || !lastName || !proxyEmail || !question1 || !question2) {
                res.status(400).json({ error: 'Missing required data' });
                return;
            }

            const [id] = await db
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
                    day1Attendee,
                    day2Attendee,
                    question1,
                    question2,
                    isAttendee,
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

            res.status(201).json({ id });
        } catch (err) {
            console.error('Error saving registration:', err);
            res.status(500).json({ error: 'Failed to save registration' });
        }
    }
);

/* GET /login?email=addr&pin=code */
router.get(
    '/login',
    async (req, res): Promise<void> => {
        const { email, pin } = req.query as { email?: string; pin?: string };

        if (!email || !pin) {
            res.status(400).json({ error: 'Missing credentials' });
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
                res.status(404).json({ error: 'Registration not found' });
                return;
            }

            res.json({ registration });
        } catch (err) {
            console.error('Error fetching registration:', err);
            res.status(500).json({ error: 'Failed to fetch registration' });
        }
    }
);

/* GET /:id */
router.get<{ id: string }, any>(
    '/:id',
    async (req, res): Promise<void> => {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ error: 'Invalid ID' });
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
                res.status(404).json({ error: 'Registration not found' });
                return;
            }

            res.json({ registration });
        } catch (err) {
            console.error('Error fetching registration:', err);
            res.status(500).json({ error: 'Failed to fetch registration' });
        }
    }
);

export default router;
