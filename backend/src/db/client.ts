// backend/src/db/client.ts
import {drizzle} from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const pool = mysql.createPool({
    "host": process.env.DB_HOST,
    "user": process.env.MARIADB_USER,
    "password": process.env.MARIADB_PASSWORD,
    "database": process.env.MARIADB_DATABASE,
});

export const db = drizzle(pool, {
    schema,
    mode: 'default', // required to satisfy DrizzleConfig
});
