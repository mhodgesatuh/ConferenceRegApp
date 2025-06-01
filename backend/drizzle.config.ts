// drizzle.config.ts
//
import 'dotenv/config';
import type { Config } from 'drizzle-kit';

// Validate required env vars
const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key} in .env file`);
    }
}

export default {
    schema: './src/db/schema.ts',
    out: './drizzle/migrations',
    driver: 'mysql2',
    dbCredentials: {
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
    },
} satisfies Config;
