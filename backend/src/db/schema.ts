import {
    mysqlTable,
    varchar,
    serial,
    timestamp,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const registrations = mysqlTable('registrations', {
    id: serial('id').primaryKey(),

    email: varchar('email', { length: 128 }).notNull().unique(),
    status: varchar('status', { length: 32 }).notNull(),

    namePrefix: varchar('name_prefix', { length: 128 }),
    firstName: varchar('first_name', { length: 128 }).notNull(),
    lastName: varchar('last_name', { length: 128 }).notNull(),
    nameSuffix: varchar('name_suffix', { length: 128 }),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const validationTables = mysqlTable('validation_tables', {
    id: serial('id').primaryKey(),

    validationTable: varchar('validation_table', { length: 32 }).notNull(),
    value: varchar('value', { length: 128 }).notNull(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
