// drizzle.config.tx

import 'dotenv/config';
import type {Config} from 'drizzle-kit';

// Validate required env vars
const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];
for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key} in .env file`);
    }
}

const port = Number(process.env.DB_PORT);
if (isNaN(port)) {
    throw new Error('DB_PORT must be a valid number in .env file');
}


export default {
    schema: './src/db/schema.ts',
    out: './drizzle/migrations',
    dialect: 'mysql',
    dbCredentials: {
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        port,
    },
} satisfies Config;
