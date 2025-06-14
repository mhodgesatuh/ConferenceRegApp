// schema.ts

import {
    index,
    mysqlTable,
    serial,
    timestamp,
    varchar,
    boolean,
    int,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm/sql';

// People attending and organizing the conference.
export const people = mysqlTable('people', {
    id: int('id').autoincrement().primaryKey(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),

    // Contact information
    email: varchar('email', { length: 128 }).notNull(),
    phone: varchar('phone', { length: 128 }),

    // Name information
    firstName: varchar('first_name', { length: 128 }).notNull(),
    lastName: varchar('last_name', { length: 128 }).notNull(),
    namePrefix: varchar('name_prefix', { length: 128 }),
    nameSuffix: varchar('name_suffix', { length: 128 }),

    // ABAC
    cancelledAttendance: boolean('cancelled_attendance'),
    isAttendee: boolean('is_attendee'),
    isMonitor: boolean('is_monitor'),
    isOrganizer: boolean('is_organizer'),
    isPresenter: boolean('is_presenter'),
    isProxy: boolean('is_proxy'),
    hasProxy: boolean('has_proxy'),
    proxyId: int('proxy_id'),
}, (table) => ({
    cancelledAttendanceIdx: index('idx_people_cancelled_attendance').on(table.cancelledAttendance),
    isAttendeeIdx: index('idx_people_is_attendee').on(table.isAttendee),
    isMonitorIdx: index('idx_people_is_monitor').on(table.isMonitor),
    isOrganizerIdx: index('idx_people_is_organizer').on(table.isOrganizer),
    isPresenterIdx: index('idx_people_is_presenter').on(table.isPresenter),
    isProxyIdx: index('idx_people_is_proxy').on(table.isProxy),
    hasProxyIdx: index('idx_people_has_proxy').on(table.hasProxy),
    proxyIdIdx: index('idx_people_proxy_id').on(table.proxyId),
}));

// Registration form.
export const registration = mysqlTable('registration', {
    id: int('id').autoincrement().primaryKey(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),


    // Conference information
    info1: varchar('info1', { length: 128 }).notNull().unique(),
    info2: varchar('info2', { length: 128 }).notNull().unique(),

    // Registration form questions
    question1: varchar('question1', { length: 128 }).notNull().unique(),
    question2: varchar('question2', { length: 128 }).notNull().unique(),
});

// Validation tables, for the options on the registration form.
export const validationTables = mysqlTable('validation_tables', {
    id: int('id').autoincrement().primaryKey(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),

    validationTable: varchar('validation_table', { length: 32 }).notNull(),
    value: varchar('value', { length: 128 }).notNull(),
}, (table) => ({
    valueIdx: index('idx_validation_tables_value').on(table.value),
}));
