// backend/src/db/client.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'conference-db',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'conference',
});

export const db = drizzle(pool, {
    schema,
    mode: 'default', // 👈 required to satisfy DrizzleConfig
});
