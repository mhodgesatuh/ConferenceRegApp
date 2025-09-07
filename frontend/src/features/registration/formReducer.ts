// frontend/src/features/registration/formReducer.ts
//
// The reducer’s sole function is to take a given value and stick it into state.
// The form reducer provides a robust, extensible way to manage every aspect of
// the form’s data lifecycle—from first render through every keystroke to any
// “reset” or “clear” action.

import {FormField} from '@/data/registrationFormData';

export type FormValue = string | boolean | number | null;
export type FormState = Record<string, FormValue>;

export const initialFormState = (fields: FormField[]): FormState =>
    fields.reduce((acc, { name, type }) => {

        switch (type) {

            // boolean flags
            case 'checkbox':
                acc[name] = false;
                break;

            // numeric inputs
            case 'number':
                acc[name] = 0;
                break;

            // UI-only sections—no state entry
            case 'section':
                break;

            // everything else (text, email, phone, hidden, pin)
            case 'text':
            case 'email':
            case 'phone':
            case 'pin':
            default:
                acc[name] = '';
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
