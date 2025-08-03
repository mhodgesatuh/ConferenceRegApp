// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import registrationRoutes from './routes/registration';
import {db} from './db/client';
import {sql} from 'drizzle-orm';

dotenv.config();

const app = express();
const port = process.env.DB_PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/registrations', registrationRoutes);

async function start() {
    try {
        await db.execute(sql`ALTER TABLE registrations AUTO_INCREMENT = 100`);
    } catch (err) {
        console.error('Failed to ensure registration id start value', err);
    }

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

start();
