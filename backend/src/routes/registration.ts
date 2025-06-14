import {Request, Response, Router} from 'express';
import {db} from '../db/client';
import {registrationData, registrations} from '../db/schema';
import {eq} from 'drizzle-orm';

interface CreateRegistrationBody {
    email: string;
    status?: string;
    fields: { name: string; value: string }[];
}

const router = Router();

// POST /api/registrations
router.post(
    '/',
    async (
        req: Request<{}, {}, CreateRegistrationBody>,
        res: Response
    ) => {
        try {
            const {email, status = 'pending', fields} = req.body;

            if (!email || !Array.isArray(fields)) {
                return res.status(400).json({error: 'Missing required data'});
            }

            // Insert registration and get the inserted ID
            const insertedIds = await db
                .insert(registrations)
                .values({email, status})
                .$returningId();

            const registrationId = insertedIds[0];

            // Insert associated registration data
            const dataEntries = fields.map((field) => ({
                registrationId,
                name: field.name,
                value: field.value,
            }));

            await db.insert(registrationData).values(dataEntries);

            return res.status(201).json({id: registrationId});
        } catch (err) {
            console.error('Error saving registration:', err);
            return res.status(500).json({error: 'Failed to save registration'});
        }
    }
);

// GET /api/registrations/:id
router.get(
    '/:id',
    async (req: Request<{ id: string }>, res: Response) => {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({error: 'Invalid ID'});
        }

        try {
            const [registration] = await db
                .select()
                .from(registrations)
                .where(eq(registrations.id, id));

            if (!registration) {
                return res.status(404).json({error: 'Registration not found'});
            }

            const data = await db
                .select()
                .from(registrationData)
                .where(eq(registrationData.registrationId, id));

            return res.json({registration, data});
        } catch (err) {
            console.error('Error fetching registration:', err);
            return res.status(500).json({error: 'Failed to fetch registration'});
        }
    }
);

export default router;
