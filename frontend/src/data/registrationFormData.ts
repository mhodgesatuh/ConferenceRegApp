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
// Defining a form section:
//    field         The field name, see backend/src/db/schema.ts
//    label         Input prompt text
//    type          Input type
//    required      Optional, set to true if needed
//    scope         The scope determines when it will get displayed
//    priv          Flag a field as being a privileged role
//
export interface FormField {
    name?: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'checkbox' | 'number' | 'section' | 'pin';
    required?: boolean;
    scope: 'admin' | 'registration';
    priv?: 'update';
}

// Export a typed constant for each form element type.
export const registrationFormData: FormField[] = [
    {
        name: 'id',
        label: 'Registration Form ID',
        type: 'number',
        scope: 'admin',
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
    },
    {
        name: 'loginPin',
        label: 'Login Pin',
        type: 'pin',
        required: true,
        scope: 'registration',
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
    },
    {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        scope: 'registration',
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
        name: 'day1Attendee',
        label: 'Attending Day 1',
        type: 'checkbox',
        required: false,
        scope: 'registration',
    },
    {
        name: 'day2Attendee',
        label: 'Attending Day 2',
        type: 'checkbox',
        required: false,
        scope: 'registration',
    },
    {
        name: 'question1',
        label: 'Question 1',
        type: 'text',
        required: true,
        scope: 'registration',
    },
    {
        name: 'question2',
        label: 'Question 2',
        type: 'text',
        required: true,
        scope: 'registration',
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
    },
    {
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
    },
    {
        name: 'proxyName',
        label: 'Please provide your name, phone number, and email address in case we need to contact you.',
        type: 'text',
        required: false,
        scope: 'registration',
    },
    {
        name: 'proxyPhone',
        label: 'Phone/Cell number',
        type: 'phone',
        required: false,
        scope: 'registration',
    },
    {
        name: 'proxyEmail',
        label: 'Email Address',
        type: 'email',
        required: false,
        scope: 'registration',
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
    },
    {
        name: 'isSponsor',
        label: 'Is sponsor',
        type: 'checkbox',
        required: false,
        scope: 'admin',
    },
];
