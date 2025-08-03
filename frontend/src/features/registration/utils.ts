// frontend/src/features/registration/utils.ts
//

import {FormField} from '@/data/registrationFormData';

// Generate a random Pin for a new registration user.
export function generatePin(length: number): string {
    let pin = '';
    for (let i = 0; i < length; i++) {
        pin += Math.floor(Math.random() * 10).toString();
    }
    return pin;
}

// Determine whether the provided form data grants the user the given role.
export function hasRole(
    fields: FormField[],
    data: Record<string, any> | undefined,
    role: 'update'
): boolean {
    return fields
        .filter((f) => f.role === role)
        .some((f) => Boolean(data?.[f.name]));
}
