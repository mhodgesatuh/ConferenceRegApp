// frontend/src/features/registration/RegistrationForm.tsx

import React, { useReducer, useEffect } from 'react';
import { FormField } from '@/data/registrationFormData';
import { formReducer, initialFormState } from './formReducer';
import { generatePin } from '@/features/registration/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox-wrapper';
import { Section } from '@/components/ui/section';

type RegistrationFormProps = {
    fields: FormField[];
    initialData?: Record<string, any>;
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({ fields, initialData }) => {
    const [state, dispatch] = useReducer(
        formReducer,
        { ...initialFormState(fields), ...(initialData || {}) }
    );

    // Generate a login pin on first render if missing
    useEffect(() => {
        if (typeof state.loginPin === 'string' && state.loginPin === '') {
            dispatch({
                type: 'CHANGE_FIELD',
                name: 'loginPin',
                value: generatePin(8),
            });
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
                            type={field.type === 'pin' ? 'text' : field.type}
                            value={state[field.name] as string | number}
                            onChange={handleChange}
                            readOnly={field.type === 'pin'}
                            required={field.required ?? false}
                        />
                    </div>
                );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { loginPin: _pin, ...payload } = state;
            const res = await fetch('/api/registrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                await res.json().catch(() => ({}));

                alert('Registration saved');
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || 'Failed to save registration');
            }
        } catch (err) {
            console.error('Registration submission failed', err);
            alert('Failed to submit registration');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(renderField)}
            <Button type="submit">Register</Button>
        </form>
    );
};

export default RegistrationForm;
