// frontend/src/index.ts
//

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import registrationRoutes from './routes/registration';
import {db} from './db/client';
import {sql} from 'drizzle-orm';
import {errorLogger, log, requestLogger} from "@/utils/logger";

dotenv.config();

const app = express();
const port = process.env.DB_PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(requestLogger());

app.use('/api/registrations', registrationRoutes);

app.use(errorLogger());

async function start() {
    try {
        await db.execute(sql`ALTER TABLE registrations
            AUTO_INCREMENT = 100`);
    } catch (err) {
        log.error('Failed to ensure registration id start value', {error: err});
    }

    app.listen(port, () => {
        log.info(`Server running on port ${port}`);
    });
}

start();
