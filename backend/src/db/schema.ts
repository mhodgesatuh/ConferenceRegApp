// backend/src/db/schema.ts
//
// Fields requiring notNull need to be also listed in registration.ts.
//

import {
    boolean,
    index,
    int,
    mysqlTable,
    timestamp,
    uniqueIndex,
    varchar,
    text,
} from 'drizzle-orm/mysql-core';
import {sql} from 'drizzle-orm/sql';

// People attending and organizing the conference.
export const registrations = mysqlTable('registrations', {

    id: int('id').autoincrement().primaryKey(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),

    // Login information
    email: varchar('email', {length: 128}).notNull(),

    // Contact information
    phone1: varchar('phone1', {length: 32}),
    phone2: varchar('phone2', {length: 32}),

    // Name information
    firstName: varchar('first_name', {length: 128}),
    lastName: varchar('last_name', {length: 128}).notNull(),
    namePrefix: varchar('name_prefix', {length: 128}),
    nameSuffix: varchar('name_suffix', {length: 128}),

    // Proxy information
    proxyName: varchar('proxy_name', {length: 128}),
    proxyPhone: varchar('proxy_phone', {length: 32}),
    proxyEmail: varchar('proxy_email', {length: 128}),

    // Registration information
    day1Attendee: boolean('day1_attendee').default(false),
    day2Attendee: boolean('day2_attendee').default(false),
    lunchMenu: varchar('lunch_menu', {length: 128}),
    question1: varchar('question1', {length: 128}).notNull(),
    question2: varchar('question2', {length: 128}).notNull(),
    isCancelled: boolean('is_cancelled').default(false),
    cancellationReason: varchar('cancellation_reason', {length: 512}),

    // Presenter information
    presenterBio: text('presenter_bio'),
    presenterPicUrl: varchar('presenter_pic_url', {length: 256}),
    session1Title: varchar('session1_title', {length: 128}),
    session1Description: text('session1_description'),
    isSecondSession: boolean('is_second_session'),
    session2Title: varchar('session2_title', {length: 128}),
    session2Description: text('session2_description'),

    // Administration
    cancelledAttendance: boolean('cancelled_attendance').default(false),
    isAttendee: boolean('is_attendee').default(true),
    isMonitor: boolean('is_monitor').default(false),
    isOrganizer: boolean('is_organizer').default(false),
    isPresenter: boolean('is_presenter').default(false),
    isSponsor: boolean('is_sponsor').default(false),
    hasProxy: boolean('has_proxy').default(false),

}, (table) => ({
    emailIdx: uniqueIndex('idx_registrations_email').on(table.email),
    cancelledAttendanceIdx: index('idx_cancelled_attendance').on(table.cancelledAttendance),
    isAttendeeIdx: index('idx_is_attendee').on(table.isAttendee),
    isMonitorIdx: index('idx_is_monitor').on(table.isMonitor),
    isOrganizerIdx: index('idx_is_organizer').on(table.isOrganizer),
    isPresenterIdx: index('idx_is_presenter').on(table.isPresenter),
    isSponsorIdx: index('idx_is_sponsor').on(table.isSponsor),
    hasProxyIdx: index('idx_has_proxy').on(table.hasProxy),
}));

export const credentials = mysqlTable('credentials', {
    id: int('id').autoincrement().primaryKey(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),

    // Foreign key to registrations
    registrationId: int('registration_id')
        .notNull()
        .references(() => registrations.id, {onDelete: 'cascade'}),

    // Login information
    loginPin: varchar('login_pin', {length: 8}).notNull(),

}, (table) => ({
    registrationIdx: index('idx_credentials_registration_id').on(table.registrationId),
    uniqueRegistration: uniqueIndex('uq_credentials_registration_id').on(table.registrationId),

}));

export const conferenceInfo = mysqlTable('conference_info', {

    id: int('id').autoincrement().primaryKey(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),

    info1: varchar('info1', {length: 128}).notNull(),
    info2: varchar('info2', {length: 128}).notNull(),
});

// Validation tables, for the options on the registration form.
export const validationTables = mysqlTable('validation_tables', {
    id: int('id').autoincrement().primaryKey(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),

    validationTable: varchar('validation_table', {length: 32}).notNull(),
    value: varchar('value', {length: 128}).notNull(),

}, (table) => ({
    valueIdx: index('idx_validation_tables_name').on(table.validationTable),
}));
