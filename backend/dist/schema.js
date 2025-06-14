// schema.js

import {index, mysqlTable, serial, timestamp, varchar,} from 'drizzle-orm/mysql-core';

// People attending and organizing the conference.
export const people = mysqlTable('people', {

    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),

    // Contact information
    email: varchar('email', {length: 128}).notNull(),
    phone: varchar('phone', {length: 128}),

    // Name information
    namePrefix: varchar('name_prefix', {length: 128}),
    firstName: varchar('first_name', {length: 128}).notNull(),
    lastName: varchar('last_name', {length: 128}).notNull(),
    nameSuffix: varchar('name_suffix', {length: 128}),

    // Attibute Based Access Control (ABAC)
    isOrganizer: varchar('is_organizer', {length: 128}),
    isAttendee: varchar('is_attendee', {length: 128}),
    cancelledAttendance: : varchar('cancelled_attendance', {length: 128}),
    isProxy: varchar('is_proxy', {length: 128}),

    // Proxy: for when someone registers others
    hasProxy: varchar('has_proxy', {length: 128}),
    proxyId: varchar('proxy_id', {length: 128}),
});

// Registration form.
export const registration = mysqlTable('registration', {

    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),

    // Conference information
    info1: varchar('info1', {length: 128}).notNull().unique(),
    info2: varchar('info2', {length: 128}).notNull().unique(),

    // Registration form questions
    question1: varchar('question1', {length: 128}).notNull().unique(),
    question2: varchar('question2', {length: 128}).notNull().unique(),
});

// Validation tables, for the options on the registration form.
export const validationTables = mysqlTable('validation_tables', {

    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),

    validationTable: varchar('validation_table', {length: 32}).notNull(),
    value: varchar('value', {length: 128}).notNull(),
});

// Indexes: for optimizing record access.
export const validationTablesValueIdx = index(
    'idx_validation_tables_value'
).on(validationTables.value);
