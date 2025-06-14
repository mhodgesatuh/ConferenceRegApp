import {bigint, index, mysqlTable, timestamp, varchar,} from 'drizzle-orm/mysql-core';

// --------------------
// registrations table
// --------------------
export const registrations = mysqlTable('registrations', (t) => ({
    id: bigint('id', {mode: 'number'}).primaryKey().autoincrement(),

    email: varchar('email', {length: 128}).notNull().unique(),
    status: varchar('status', {length: 32}).notNull(),

    namePrefix: varchar('name_prefix', {length: 128}),
    firstName: varchar('first_name', {length: 128}).notNull(),
    lastName: varchar('last_name', {length: 128}).notNull(),
    nameSuffix: varchar('name_suffix', {length: 128}),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}));

// -------------------------
// validation_tables table
// -------------------------
export const validationTables = mysqlTable(
    'validation_tables',
    (t) => ({
        id: bigint('id', {mode: 'number'}).primaryKey().autoincrement(),

        validationTable: varchar('validation_table', {length: 32}).notNull(),
        value: varchar('value', {length: 128}).notNull(),

        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    }),
    (t) => [
        index('validation_table_idx').on(t.validationTable),
    ]
);
