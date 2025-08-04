import React, {useReducer} from 'react';
import {FormField} from '@/data/registrationFormData';
import {formReducer, initialFormState, FormState, Action} from '../state/formReducer';

export function useFormState(fields: FormField[], initialData?: Record<string, any>): [FormState, React.Dispatch<Action>] {
    return useReducer(formReducer, {...initialFormState(fields), ...(initialData || {})});
}
