// frontend/src/features/registration/RegistrationForm.tsx

import React, { useEffect, useReducer } from 'react';
import { FormField } from '@/data/registrationFormData';
import { formReducer, initialFormState } from './formReducer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox-wrapper';
import { Section } from '@/components/ui/section';
import { generatePin } from '@/features/registration/utils';

type RegistrationFormProps = { fields: FormField[] };

const RegistrationForm: React.FC<RegistrationFormProps> = ({ fields }) => {
    const [state, dispatch] = useReducer(formReducer, initialFormState(fields));

    // On first render, if the pin is missing or empty, generate one.
    useEffect(() => {
        if (typeof state.loginPin === 'string' && state.loginPin === '') {
            const pin = generatePin(8);
            dispatch({ type: 'CHANGE_FIELD', name: 'loginPin', value: pin });
        }
    }, [state.loginPin]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, type, value, valueAsNumber } = e.target;
        let parsed: string | number;

        switch (type) {
            case 'number':
                parsed = isNaN(valueAsNumber) ? 0 : valueAsNumber;
                break;
            default:
                parsed = value;
        }

        dispatch({ type: 'CHANGE_FIELD', name, value: parsed });
    };

    const handleCheckboxChange = (
        name: string,
        value: boolean | 'indeterminate' | undefined
    ) => {
        dispatch({ type: 'CHANGE_FIELD', name, value: Boolean(value) });
    };

    const renderField = (field: FormField) => {
        switch (field.type) {
            case 'section':
                return <Section key={field.name}>{field.label}</Section>;

            case 'checkbox':
                return (
                    <Checkbox
                        key={field.name}
                        id={field.name}
                        name={field.name}
                        label={field.label}
                        checked={state[field.name] as boolean}
                        onCheckedChange={(val) => handleCheckboxChange(field.name, val)}
                        required={field.required ?? false}
                    />
                );

            default:
                return (
                    <div key={field.name} className="flex flex-col gap-1">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Input
                            id={field.name}
                            name={field.name}
                            type={field.type}
                            value={state[field.name] as string | number}
                            onChange={handleChange}
                            required={field.required ?? false}
                        />
                    </div>
                );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Submit form data
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(renderField)}
            <Button type="submit">Register</Button>
        </form>
    );
};

export default RegistrationForm;
