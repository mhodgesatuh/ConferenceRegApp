// frontend/src/data/registrationFormData.ts
//

// Define form input shape
export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'checkbox' | 'number' | 'hidden'
        | 'section' | 'pin' | 'secure-checkbox' | 'secure-section';
    required: boolean;
}

// Export a typed constant for each input field.
export const registrationFormData: FormField[] = [
    {
        name: 'id',
        label: 'Registration Form ID',
        type: 'hidden',
        required: true,
    },
    {
        name: 'Login Information',
        label: 'You will be able to use your email address and the assigned Pin if you need to return to the form.',
        type: 'section',
        required: false,
    },
    {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
    },
    {
        name: 'loginPin',
        label: 'Login Pin',
        type: 'pin',
        required: true,
    },
    {
        name: 'Contact Information',
        label: 'Provide your contact information or for the person being registered.',
        type: 'section',
        required: false,
    },
    {
        name: 'phone1',
        label: 'Primary Phone',
        type: 'phone',
        required: false,
    },
    {
        name: 'phone2',
        label: 'Secondary Phone',
        type: 'phone',
        required: false,
    },
    {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        required: false,
    },
    {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
    },
    {
        name: 'namePrefix',
        label: 'Name Prefix',
        type: 'text',
        required: false,
    },
    {
        name: 'nameSuffix',
        label: 'Name Suffix',
        type: 'text',
        required: false,
    },
    {
        name: 'Proxy Registration',
        label: 'If you are registering another person, please provide your contact information.',
        type: 'section',
        required: false,
    },
    {
        name: 'hasProxy',
        label: 'I am registering the above person.',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'proxyName',
        label: 'Please provide your name, phone number, and email address in case we need to contact you.',
        type: 'text',
        required: false,
    },
    {
        name: 'proxyPhone',
        label: 'Phone/Cell number',
        type: 'phone',
        required: false,
    },
    {
        name: 'proxyEmail',
        label: 'Email Address',
        type: 'phone',
        required: false,
    },
    {
        name: 'cancelledAttendance',
        label: 'Cancel Attendance',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'day1Attendee',
        label: 'Attending Day 1',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'day2Attendee',
        label: 'Attending Day 2',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'question1',
        label: 'Question 1',
        type: 'text',
        required: true,
    },
    {
        name: 'question2',
        label: 'Question 2',
        type: 'text',
        required: true,
    },
    {
        name: 'Roles Administration',
        label: 'This is a secured section of the form for administrators only',
        type: 'secure-section',
        required: false,
    },
    {
        name: 'isAttendee',
        label: 'Is attendee',
        type: 'secure-checkbox',
        required: false,
    },
    {
        name: 'isMonitor',
        label: 'Is monitor',
        type: 'secure-checkbox',
        required: false,
    },
    {
        name: 'isOrganizer',
        label: 'Is organizer',
        type: 'secure-checkbox',
        required: false,
    },
    {
        name: 'isPresenter',
        label: 'Is presenter',
        type: 'secure-checkbox',
        required: false,
    },
    {
        name: 'isSponsor',
        label: 'Is sponsor',
        type: 'secure-checkbox',
        required: false,
    },
];
