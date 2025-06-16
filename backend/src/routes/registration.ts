import { Router } from 'express';
import { db } from '../db/client';
import { registrations } from '../db/schema';
import { eq } from 'drizzle-orm';

interface CreateRegistrationBody {
    personId: number;
    question1: string;
    question2: string;
}

const router = Router();

/* POST / */
router.post<{}, any, CreateRegistrationBody>(
    '/',
    async (req, res): Promise<void> => {
        try {
            const { personId, question1, question2 } = req.body;

            if (!personId || !question1 || !question2) {
                res.status(400).json({ error: 'Missing required data' });
                return;
            }

            const [id] = await db
                .insert(registrations)
                .values({ personId, question1, question2 })
                .$returningId();

            res.status(201).json({ id });
        } catch (err) {
            console.error('Error saving registration:', err);
            res.status(500).json({ error: 'Failed to save registration' });
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
            const [registration] = await db
                .select()
                .from(registrations)
                .where(eq(registrations.id, id));

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
