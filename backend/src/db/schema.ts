// schema.ts

import {
    index,
    mysqlTable,
    timestamp,
    varchar,
    boolean,
    int,
    foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm/sql';

// People attending and organizing the conference.
export const people = mysqlTable('people', {

    id: int('id').autoincrement().primaryKey(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),

    // Contact information
    email: varchar('email', { length: 128 }).notNull(),
    phone1: varchar('phone1', { length: 32 }),
    phone2: varchar('phone2', { length: 32 }),

    // Name information
    firstName: varchar('first_name', { length: 128 }),
    lastName: varchar('last_name', { length: 128 }).notNull(),
    namePrefix: varchar('name_prefix', { length: 128 }),
    nameSuffix: varchar('name_suffix', { length: 128 }),

    // ABAC
    cancelledAttendance: boolean('cancelled_attendance').default(false),
    isAttendee: boolean('is_attendee').default(false),
    isMonitor: boolean('is_monitor').default(false),
    isOrganizer: boolean('is_organizer').default(false),
    isPresenter: boolean('is_presenter').default(false),
    isSponsor: boolean('is_sponsor').default(false),
    isProxy: boolean('is_proxy').default(false),
    hasProxy: boolean('has_proxy').default(false),

    // If someone registered this person
    proxyId: int('proxy_id').default(sql`NULL`),

}, (table) => ({
    cancelledAttendanceIdx: index('idx_people_cancelled_attendance').on(table.cancelledAttendance),
    isAttendeeIdx: index('idx_people_is_attendee').on(table.isAttendee),
    isMonitorIdx: index('idx_people_is_monitor').on(table.isMonitor),
    isOrganizerIdx: index('idx_people_is_organizer').on(table.isOrganizer),
    isPresenterIdx: index('idx_people_is_presenter').on(table.isPresenter),
    isSponsorIdx: index('idx_people_is_sponsor').on(table.isSponsor),
    isProxyIdx: index('idx_people_is_proxy').on(table.isProxy),
    hasProxyIdx: index('idx_people_has_proxy').on(table.hasProxy),
    proxyIdIdx: index('idx_people_proxy_id').on(table.proxyId),
}));

// Registration form.
export const registrations = mysqlTable('registration', {

    id: int('id').autoincrement().primaryKey(),
    personId: int('person_id').notNull(),
    day1Attendee: boolean('day1_attendee').default(false),
    day2Attendee: boolean('day2_attendee').default(false),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),

    // Registration form questions
    question1: varchar('question1', { length: 128 }).notNull(),
    question2: varchar('question2', { length: 128 }).notNull(),

}, (table) => ({
    personIdFk: foreignKey({
        columns: [table.personId],
        foreignColumns: [people.id],
        name: 'fk_registration_person_id',
    }),
    personIdIdx: index('idx_registration_person_id').on(table.personId),
}));

export const conferenceInfo = mysqlTable('conference_info', {

    id: int('id').autoincrement().primaryKey(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),

    info1: varchar('info1', { length: 128 }).notNull(),
    info2: varchar('info2', { length: 128 }).notNull(),
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
