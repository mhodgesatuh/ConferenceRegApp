// src/routes/registration.ts

import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { registrations } from '../db/schema';
import { eq } from 'drizzle-orm';

interface CreateRegistrationBody {
    personId: number;
    question1: string;
    question2: string;
}

const router = Router();

router.post('/', async (
    req: Request<{}, {}, CreateRegistrationBody>,
    res: Response
): Promise<Response> => {
    try {
        const { personId, question1, question2 } = req.body;

        if (!personId || !question1 || !question2) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        const insertedIds = await db
            .insert(registrations)
            .values({ personId, question1, question2 })
            .$returningId();

        return res.status(201).json({ id: insertedIds[0] });
    } catch (err) {
        console.error('Error saving registration:', err);
        return res.status(500).json({ error: 'Failed to save registration' });
    }
});

router.get('/:id', async (
    req: Request<{ id: string }>,
    res: Response
): Promise<Response> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const [registration] = await db
            .select()
            .from(registrations)
            .where(eq(registrations.id, id));

        if (!registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        return res.json({ registration });
    } catch (err) {
        console.error('Error fetching registration:', err);
        return res.status(500).json({ error: 'Failed to fetch registration' });
    }
});

export default router;
