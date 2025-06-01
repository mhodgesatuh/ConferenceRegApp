// backend/src/db/schema.ts

import {
    mysqlTable,
    varchar,
    serial,
    timestamp,
    int,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const registrations = mysqlTable('registrations', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 128 }),
    status: varchar('status', { length: 32 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const registrationData = mysqlTable('registration_data', {
    id: serial('id').primaryKey(),
    registrationId: int('registration_id')
        .notNull()
        .references(() => registrations.id),
    name: varchar('name', { length: 64 }).notNull(),
    value: varchar('value', { length: 512 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
