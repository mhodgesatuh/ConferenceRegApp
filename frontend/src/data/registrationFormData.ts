// frontend/src/data/registrationFormData.ts
//
//
// Define the form's sections and input prompts.
//

// Defining a form section:
//    label         Describe the purpose of the section
//    type          'section'
//    scope         The scope determines when it will get displayed
//
// Defining a form input field:
//    name          The field name, see backend/src/db/schema.ts
//    label         Input prompt text
//    type          Input type
//    required      Set to true if needed
//    scope         The scope determines when it will get displayed
//    priv          Flag a field as being a privileged role

export interface FormSectionHeading {
    label: string;
    type: 'section';
    scope: 'admin' | 'registration';
}

export interface FormInputField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'checkbox' | 'number' | 'pin';
    required: boolean;
    scope: 'admin' | 'registration';
    priv: 'update' | null;
}

export type FormField = FormSectionHeading | FormInputField;

// Export a typed constant for each form element type.
export const registrationFormData: FormField[] = [
    {
        name: 'id',
        label: 'Registration Form ID',
        type: 'number',
        required: false,
        scope: 'admin',
        priv: null,
    },
    {
        label: 'You will be able to use your email address and the provided Pin if you need to update your registration information.',
        type: 'section',
        scope: 'registration',
    },
    {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'loginPin',
        label: 'Login Pin',
        type: 'pin',
        required: true,
        scope: 'registration',
        priv: null,
    },
    {
        label: 'Provide your (attendee) contact information.',
        type: 'section',
        scope: 'registration',
    },
    {
        name: 'phone1',
        label: 'Primary Phone',
        type: 'phone',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'phone2',
        label: 'Secondary Phone',
        type: 'phone',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'namePrefix',
        label: 'Name Prefix',
        type: 'text',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'nameSuffix',
        label: 'Name Suffix',
        type: 'text',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'day1Attendee',
        label: 'Attending Day 1',
        type: 'checkbox',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'day2Attendee',
        label: 'Attending Day 2',
        type: 'checkbox',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'question1',
        label: 'Question 1',
        type: 'text',
        required: true,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'question2',
        label: 'Question 2',
        type: 'text',
        required: true,
        scope: 'registration',
        priv: null,
    },
    {
        label: 'If you need to cancel, please let us know.',
        type: 'section',
        scope: 'registration',
    },
    {
        name: 'cancelledAttendance',
        label: 'Cancel attendance',
        type: 'checkbox',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        label: 'If you are registering another person, please provide your contact information.',
        type: 'section',
        scope: 'registration',
    },
    {
        name: 'hasProxy',
        label: 'I am registering the above person.',
        type: 'checkbox',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'proxyName',
        label: 'Your name, in case we need to contact you',
        type: 'text',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'proxyPhone',
        label: 'Your phone/cell number',
        type: 'phone',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        name: 'proxyEmail',
        label: 'Your email Address',
        type: 'email',
        required: false,
        scope: 'registration',
        priv: null,
    },
    {
        label: 'This is a secured section of the form for administrators only',
        type: 'section',
        scope: 'admin',
    },
    {
        name: 'isAttendee',
        label: 'Is attendee (uncheck to indicate a cancellation)',
        type: 'checkbox',
        required: false,
        scope: 'admin',
        priv: null,
    },
    {
        name: 'isMonitor',
        label: 'Is monitor (has "update" privileges)',
        type: 'checkbox',
        required: false,
        scope: 'admin',
        priv: 'update',
    },
    {
        name: 'isOrganizer',
        label: 'Is organizer (has "update" privileges)',
        type: 'checkbox',
        required: false,
        scope: 'admin',
        priv: 'update',
    },
    {
        name: 'isPresenter',
        label: 'Is presenter',
        type: 'checkbox',
        required: false,
        scope: 'admin',
        priv: null,
    },
    {
        name: 'isSponsor',
        label: 'Is sponsor',
        type: 'checkbox',
        required: false,
        scope: 'admin',
        priv: null,
    },
];
