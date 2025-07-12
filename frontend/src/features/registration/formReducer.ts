// frontend/src/features/registration/formReducer.ts
import { FormField } from '@/data/formData';

export type FormValue = string | boolean | number;
export type FormState = Record<string, FormValue>;

export const initialFormState = (fields: FormField[]): FormState =>
    fields.reduce((acc, { name, type }) => {
        acc[name] =
            type === 'checkbox'
                ? false
                : type === 'number'
                    ? 0
                    : '';
        return acc;
    }, {} as FormState);

export type Action =
    | { type: 'CHANGE_FIELD'; name: string; value: FormValue }
    | { type: 'RESET'; initialState: FormState };

export function formReducer(state: FormState, action: Action): FormState {
    switch (action.type) {
        case 'CHANGE_FIELD':
            return { ...state, [action.name]: action.value };
        case 'RESET':
            return action.initialState;
        default:
            return state;
    }
}
