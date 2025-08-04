// frontend/src/features/registration/formReducer.ts
//
// The reducer’s sole function is to take a given value and stick it into state.
// The form reducer provides a robust, extensible way to manage every aspect of
// the form’s data lifecycle—from first render through every keystroke to any
// “reset” or “clear” action.
//

import {FormField} from '@/data/registrationFormData';

export type FormValue = string | boolean | number;
export type FormState = Record<string, FormValue>;

export const initialFormState = (fields: FormField[]): FormState =>
    fields.reduce((acc, field) => {
        if (field.type === 'section') return acc;

        switch (field.type) {
            // boolean flags
            case 'checkbox':
                acc[field.name] = false;
                break;

            // numeric inputs
            case 'number':
                acc[field.name] = 0;
                break;

            // everything else (text, email, phone, pin)
            case 'text':
            case 'email':
            case 'phone':
            case 'pin':
            default:
                acc[field.name] = '';
        }
        return acc;
    }, {} as FormState);

export type Action =
    | { type: 'CHANGE_FIELD'; name: string; value: FormValue }
    | { type: 'RESET'; initialState: FormState };

export function formReducer(state: FormState, action: Action): FormState {
    switch (action.type) {
        case 'CHANGE_FIELD':
            return {
                ...state,
                [action.name]: action.value,
            };
        case 'RESET':
            return action.initialState;
        default:
            return state;
    }
}
