import {
    index,
    mysqlTable,
    serial,
    timestamp,
    varchar,
    boolean,
    int,
} from 'drizzle-orm/mysql-core';

// People attending and organizing the conference.
export const people = mysqlTable('people', {

    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),

    // Contact information
    email: varchar('email', {length: 128}).notNull(),
    phone: varchar('phone', {length: 128}),

    // Name information
    firstName: varchar('first_name', {length: 128}).notNull(),
    lastName: varchar('last_name', {length: 128}).notNull(),
    namePrefix: varchar('name_prefix', {length: 128}),
    nameSuffix: varchar('name_suffix', {length: 128}),

    // Attibute Based Access Control (ABAC)
    cancelledAttendance: boolean('cancelled_attendance'),
    isAttendee: boolean('is_attendee'),
    isMonitor: boolean('is_monitor'),
    isOrganizer: boolean('is_organizer'),
    isPresenter: boolean('is_presenter'),
    isProxy: boolean('is_proxy'),

    // Proxy: for when someone registers others
    hasProxy: boolean('has_proxy'),
    proxyId: int('proxy_id'),
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

export const peopleCancelledAttendanceIdx = index(
    'idx_people_cancelled_attendance'
).on(people.cancelledAttendance);

export const peopleIsAttendeeIdx = index(
    'idx_people_is_attendee'
).on(people.isAttendee);

export const peopleIsMonitorIdx = index(
    'idx_people_is_monitor'
).on(people.isMonitor);

export const peopleIsOrganizerIdx = index(
    'idx_people_is_organizer'
).on(people.isOrganizer);

export const peopleIsPresenterIdx = index(
    'idx_people_is_presenter'
).on(people.isPresenter);

export const peopleIsProxyIdx = index(
    'idx_people_is_proxy'
).on(people.isProxy);

export const peopleHasProxyIdx = index(
    'idx_people_has_proxy'
).on(people.hasProxy);

export const peopleProxyIdIdx = index(
    'idx_people_proxy_id'
).on(people.proxyId);

