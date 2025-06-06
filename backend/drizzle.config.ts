// drizzle.config.tx

import 'dotenv/config';
import type { Config } from 'drizzle-kit';

// Validate required env vars
const required = ['DB_HOST', 'MARIADB_USER', 'MARIADB_PASSWORD', 'MARIADB_DATABASE', 'DB_PORT'];
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
        user: process.env.MARIADB_USER!,
        password: process.env.MARIADB_PASSWORD!,
        database: process.env.MARIADB_DATABASE!,
        port,
    },
} satisfies Config;
