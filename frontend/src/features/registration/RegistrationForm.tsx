// frontend/src/features/registration/RegistrationForm.tsx
import React, { useReducer } from 'react';
import { FormField } from '@/data/formData';
import { formReducer, initialFormState } from './formReducer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type RegistrationFormProps = {
    fields: FormField[];
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({ fields }) => {
    const [state, dispatch] = useReducer(
        formReducer,
        initialFormState(fields)
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, type, checked, value, valueAsNumber } = e.target;
        const parsed =
            type === 'checkbox'
                ? checked
                : type === 'number'
                    ? isNaN(valueAsNumber)
                        ? 0
                        : valueAsNumber
                    : value;
        dispatch({ type: 'CHANGE_FIELD', name, value: parsed });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // … same as before …
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-1">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'checkbox' ? (
                        <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={state[field.name] as boolean}
                            onChange={handleChange}
                            required={field.required}
                        />
                    ) : (
                        <Input
                            id={field.name}
                            name={field.name}
                            type={field.type}
                            value={state[field.name] as string | number}
                            onChange={handleChange}
                            required={field.required}
                        />
                    )}
                </div>
            ))}

            <Button type="submit">Register</Button>
        </form>
    );
};

export default RegistrationForm;
