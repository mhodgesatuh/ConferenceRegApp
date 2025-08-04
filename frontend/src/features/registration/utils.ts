// frontend/src/features/registration/utils.ts
//

import {FormField, FormInputField} from '@/data/registrationFormData';

// Type guard to narrow a form element to an input field.
export function isInputField(field: FormField): field is FormInputField {
    return field.type !== 'section';
}

// Generate a random Pin for a new registration user.
export function generatePin(length: number): string {
    let pin = '';
    for (let i = 0; i < length; i++) {
        pin += Math.floor(Math.random() * 10).toString();
    }
    return pin;
}