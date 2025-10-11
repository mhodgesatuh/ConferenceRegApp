// frontend/src/data/registrationFormData.ts
//
// Define the form's sections and input prompts.
//

// Defining a form section:
//    name          'label'
//    label         Describe the purpose of the section
//    type          'section'
//    scope         The scope determines when it will get displayed
//
// Defining a field section:
//    name          The field name, see backend/src/db/schema.ts
//    label         Input prompt text
//    type          Input type
//    required      Optional, set to true if needed
//    scope         The scope determines when it will get displayed
//    priv          Flag a field as being a privileged role
//    clickedByDefault - Clicked by default on the Columns drop-down menu
//    validationTable  - Input type is a table-driven drop-down list.
//    hasFilterButton  - Associate with a registration table filter button
//

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'checkbox' | 'number' | 'section' | 'validation-table' | 'text-area' | 'presenter-photo';
    required?: boolean;
    scope: 'admin' | 'registration';
    priv?: 'update';
    readOnly?: boolean;
    clickedByDefault?: boolean;
    validationTable?: string;
    hasFilterButton?: boolean
}

// Export a typed constant for each form element type.
export const registrationFormData: FormField[] = [
    {
        name: 'contact-info',
        label: 'Provide your contact information',
        type: 'section',
        scope: 'registration',
    },
    {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        scope: 'registration',
        clickedByDefault: true,
    },
    {
        name: 'phone1',
        label: 'Primary Phone',
        type: 'phone',
        required: false,
        scope: 'registration',
        clickedByDefault: true,
    },
    {
        name: 'phone2',
        label: 'Secondary Phone',
        type: 'phone',
        required: false,
        scope: 'registration',
    },
    {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        required: false,
        scope: 'registration',
        clickedByDefault: true,
    },
    {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        scope: 'registration',
        clickedByDefault: true,
    },
    {
        name: 'namePrefix',
        label: 'Name Prefix',
        type: 'text',
        required: false,
        scope: 'registration',
    },
    {
        name: 'nameSuffix',
        label: 'Name Suffix',
        type: 'text',
        required: false,
        scope: 'registration',
    },
    {
        name: 'attendance-info',
        label: 'Attendance information.',
        type: 'section',
        scope: 'registration',
    },
    {
        name: 'day1Attendee',
        label: 'Attending Day 1',
        type: 'checkbox',
        required: false,
        scope: 'registration',
        clickedByDefault: true,
        hasFilterButton: true,
    },
    {
        name: 'day2Attendee',
        label: 'Attending Day 2',
        type: 'checkbox',
        required: false,
        scope: 'registration',
        clickedByDefault: true,
        hasFilterButton: true,
    },
    {
        name: 'lunchMenu',
        label: 'Lunch Menu',
        type: 'validation-table',
        required: false,
        scope: 'registration',
        validationTable: 'lunch_menu',
    },
    {
        name: 'question1',
        label: 'Question 1',
        type: 'text-area',
        required: true,
        scope: 'registration',
    },
    {
        name: 'question2',
        label: 'Question 2',
        type: 'text-area',
        required: true,
        scope: 'registration',
    },
    {
        name: 'presenter',
        label: 'Conference speakers, please provide a bio and a picture.',
        type: 'section',
        required: false,
        scope: 'registration',
    },
    {
        name: 'presenterBio',
        label: 'Bio',
        type: 'text-area',
        required: false,
        scope: 'registration',
    },
    {
        name: 'presenterPicUrl',
        label: 'Photo Upload',
        type: 'presenter-photo',
        required: false,
        scope: 'registration',
    },
    {
        name: 'session1Title',
        label: 'Session Title',
        type: 'text',
        required: false,
        scope: 'registration',
    },
    {
        name: 'session1Description',
        label: 'Session Description',
        type: 'text-area',
        required: false,
        scope: 'registration',
    },
    {
        name: 'isSecondSession',
        label: 'Are you also presenting a 2nd session?',
        type: 'checkbox',
        required: false,
        scope: 'registration',
    },
    {
        name: 'session2Title',
        label: 'Session Title',
        type: 'text',
        required: false,
        scope: 'registration',
    },
    {
        name: 'session2Description',
        label: 'Session Description',
        type: 'text-area',
        required: false,
        scope: 'registration',
    },
    {
        name: 'cancellation',
        label: 'If you need to cancel, please return to this form to let us know.',
        type: 'section',
        scope: 'registration',
    },
    {
        name: 'cancelledAttendance',
        label: 'Cancel attendance',
        type: 'checkbox',
        required: false,
        scope: 'registration',
        clickedByDefault: true,
        hasFilterButton: true,
    },
    {
        name: 'cancellationReason',
        label: 'Reason for cancellation',
        type: 'text',
        required: false,
        scope: 'registration',
    },
    {
        name: 'proxy-info',
        label: 'If you are registering another person, please provide your contact information.',
        type: 'section',
        required: false,
        scope: 'registration',
    },
    {
        name: 'hasProxy',
        label: 'I am registering the above person.',
        type: 'checkbox',
        required: false,
        scope: 'registration',
        clickedByDefault: true,
        hasFilterButton: true,
    },
    {
        name: 'proxyName',
        label: 'Your name, in case we need to contact you',
        type: 'text',
        required: false,
        scope: 'registration',
    },
    {
        name: 'proxyPhone',
        label: 'Your phone/cell number',
        type: 'phone',
        required: false,
        scope: 'registration',
    },
    {
        name: 'proxyEmail',
        label: 'Your email Address',
        type: 'email',
        required: false,
        scope: 'registration',
    },
    {
        name: 'conference-roles',
        label: 'For internal use: indicate additional attendee roles.',
        type: 'section',
        scope: 'admin',
    },
    {
        name: 'id',
        label: 'Registration Form ID',
        type: 'number',
        scope: 'admin',
    },
    {
        name: 'isAttendee',
        label: 'Is attendee (uncheck to indicate a cancellation)',
        type: 'checkbox',
        required: false,
        scope: 'admin',
        clickedByDefault: true,
    },
    {
        name: 'isMonitor',
        label: 'Is monitor (has "admin" privileges)',
        type: 'checkbox',
        required: false,
        scope: 'admin',
        priv: 'update',
        clickedByDefault: true,
        hasFilterButton: true,
    },
    {
        name: 'isOrganizer',
        label: 'Is organizer (has "admin" privileges)',
        type: 'checkbox',
        required: false,
        scope: 'admin',
        priv: 'update',
        clickedByDefault: true,
        hasFilterButton: true,
    },
    {
        name: 'isPresenter',
        label: 'Is presenter',
        type: 'checkbox',
        required: false,
        scope: 'admin',
        clickedByDefault: true,
        hasFilterButton: true,
    },
    {
        name: 'isSponsor',
        label: 'Is sponsor',
        type: 'checkbox',
        required: false,
        scope: 'admin',
        clickedByDefault: true,
        hasFilterButton: true,
    },
    {
        name: 'hasRsvp',
        label: 'Has RSVP',
        type: 'checkbox',
        required: false,
        scope: 'admin',
        clickedByDefault: true,
        hasFilterButton: true,
    },
];
