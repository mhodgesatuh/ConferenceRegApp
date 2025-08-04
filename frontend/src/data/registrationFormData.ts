// frontend/src/data/registrationFormData.ts
//
//
// Define the form's sections and input prompts.
//

// Defining a form section:
//    label         Describe the purpose of the section
//    type          'section'
//    presentationScopes  Form sections the field should appear in
//
// Defining a form input field:
//    name          The field name, see backend/src/db/schema.ts
//    label         Input prompt text
//    type          Input type
//    required      Set to true if needed
//    priv          Flag a field as being a privileged role
//    presentationScopes  Form sections the field should appear in

export type PresentationScope = 'registration' | 'contact' | 'proxy' | 'admin';

export interface FormSectionHeading {
    label: string;
    type: 'section';
    presentationScopes: PresentationScope[];
}

export interface FormInputField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'checkbox' | 'number' | 'pin';
    required: boolean;
    priv: 'update' | null;
    presentationScopes: PresentationScope[];
}

export type FormField = FormSectionHeading | FormInputField;

// Export a typed constant for each form element type.
export const registrationFormData: FormField[] = [
    {
        name: 'id',
        label: 'Registration Form ID',
        type: 'number',
        required: false,
        priv: null,
        presentationScopes: ['registration'],
    },
    {
        label: 'You will be able to use your email address and the provided Pin if you need to update your registration information.',
        type: 'section',
        presentationScopes: ['registration'],
    },
    {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        priv: null,
        presentationScopes: ['registration'],
    },
    {
        name: 'loginPin',
        label: 'Login Pin',
        type: 'pin',
        required: true,
        priv: null,
        presentationScopes: ['registration'],
    },
    {
        label: 'Provide your (attendee) contact information.',
        type: 'section',
        presentationScopes: ['contact'],
    },
    {
        name: 'phone1',
        label: 'Primary Phone',
        type: 'phone',
        required: false,
        priv: null,
        presentationScopes: ['contact'],
    },
    {
        name: 'phone2',
        label: 'Secondary Phone',
        type: 'phone',
        required: false,
        priv: null,
        presentationScopes: ['contact'],
    },
    {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        required: false,
        priv: null,
        presentationScopes: ['contact'],
    },
    {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        priv: null,
        presentationScopes: ['contact'],
    },
    {
        name: 'namePrefix',
        label: 'Name Prefix',
        type: 'text',
        required: false,
        priv: null,
        presentationScopes: ['contact'],
    },
    {
        name: 'nameSuffix',
        label: 'Name Suffix',
        type: 'text',
        required: false,
        priv: null,
        presentationScopes: ['contact'],
    },
    {
        name: 'day1Attendee',
        label: 'Attending Day 1',
        type: 'checkbox',
        required: false,
        priv: null,
        presentationScopes: ['registration'],
    },
    {
        name: 'day2Attendee',
        label: 'Attending Day 2',
        type: 'checkbox',
        required: false,
        priv: null,
        presentationScopes: ['registration'],
    },
    {
        name: 'question1',
        label: 'Question 1',
        type: 'text',
        required: true,
        priv: null,
        presentationScopes: ['registration'],
    },
    {
        name: 'question2',
        label: 'Question 2',
        type: 'text',
        required: true,
        priv: null,
        presentationScopes: ['registration'],
    },
    {
        label: 'If you need to cancel, please let us know.',
        type: 'section',
        presentationScopes: ['registration'],
    },
    {
        name: 'cancelledAttendance',
        label: 'Cancel attendance',
        type: 'checkbox',
        required: false,
        priv: null,
        presentationScopes: ['registration'],
    },
    {
        label: 'If you are registering another person, please provide your contact information.',
        type: 'section',
        presentationScopes: ['proxy'],
    },
    {
        name: 'hasProxy',
        label: 'I am registering the above person.',
        type: 'checkbox',
        required: false,
        priv: null,
        presentationScopes: ['proxy'],
    },
    {
        name: 'proxyName',
        label: 'Your name, in case we need to contact you',
        type: 'text',
        required: false,
        priv: null,
        presentationScopes: ['proxy'],
    },
    {
        name: 'proxyPhone',
        label: 'Your phone/cell number',
        type: 'phone',
        required: false,
        priv: null,
        presentationScopes: ['proxy'],
    },
    {
        name: 'proxyEmail',
        label: 'Your email Address',
        type: 'email',
        required: false,
        priv: null,
        presentationScopes: ['proxy'],
    },
    {
        label: 'This is a secured section of the form for administrators only',
        type: 'section',
        presentationScopes: ['admin'],
    },
    {
        name: 'isAttendee',
        label: 'Is attendee (uncheck to indicate a cancellation)',
        type: 'checkbox',
        required: false,
        priv: null,
        presentationScopes: ['admin'],
    },
    {
        name: 'isMonitor',
        label: 'Is monitor (has "update" privileges)',
        type: 'checkbox',
        required: false,
        priv: 'update',
        presentationScopes: ['admin'],
    },
    {
        name: 'isOrganizer',
        label: 'Is organizer (has "update" privileges)',
        type: 'checkbox',
        required: false,
        priv: 'update',
        presentationScopes: ['admin'],
    },
    {
        name: 'isPresenter',
        label: 'Is presenter',
        type: 'checkbox',
        required: false,
        priv: null,
        presentationScopes: ['admin'],
    },
    {
        name: 'isSponsor',
        label: 'Is sponsor',
        type: 'checkbox',
        required: false,
        priv: null,
        presentationScopes: ['admin'],
    },
];
