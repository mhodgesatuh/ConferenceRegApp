// frontend/src/features/registration/utils.ts
//

import {FormField} from '@/data/registrationFormData';

// Type guard to ensure field.name is a string, required for field-safe rendering.
export function safeFieldName(field: FormField): field is FormField & { name: string } {
    return typeof field.name === 'string';
}

// Generate a random Pin for a new registration user.
export function generatePin(length: number): string {
    let pin = '';
    for (let i = 0; i < length; i++) {
        pin += Math.floor(Math.random() * 10).toString();
    }
    return pin;
}