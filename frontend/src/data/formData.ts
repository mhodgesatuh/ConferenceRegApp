// frontend/src/data/formData.ts
//

// Define form input shape
export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'checkbox' | 'number' | 'hidden';
    required: boolean;
}

// Export a typed constant for each input field.
export const formData: FormField[] = [
    {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
    },
    {
        name: 'phone1',
        label: 'Primary Phone',
        type: 'tel',
        required: false,
    },
    {
        name: 'phone2',
        label: 'Secondary Phone',
        type: 'tel',
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
        name: 'cancelledAttendance',
        label: 'Cancel Attendance',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'isAttendee',
        label: 'Attendee?',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'isMonitor',
        label: 'Monitor?',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'isOrganizer',
        label: 'Organizer?',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'isPresenter',
        label: 'Presenter?',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'isSponsor',
        label: 'Sponsor?',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'isProxy',
        label: 'Proxy?',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'hasProxy',
        label: 'Has Proxy?',
        type: 'checkbox',
        required: false,
    },
    {
        name: 'proxyId',
        label: 'Proxy Person ID',
        type: 'number',
        required: false,
    },
    {
        name: 'personId',
        label: 'Person ID',
        type: 'hidden',
        required: true,
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
];
