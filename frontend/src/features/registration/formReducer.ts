// frontend/src/features/registration/formReducer.ts

export interface FormField {
    name: string;
    label: React.ReactNode;
    type?: string;
}

export interface FormState {
    [key: string]: string;
}

export interface FormAction {
    type: 'UPDATE_FIELD';
    name: string;
    value: string;
}

export function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
        case 'UPDATE_FIELD':
            return {...state, [action.name]: action.value};
        default:
            return state;
    }
}

export function initialFormState(fields: FormField[]): FormState {
    const state: FormState = {};
    for (const field of fields) {
        state[field.name] = '';
    }
    return state;
}
