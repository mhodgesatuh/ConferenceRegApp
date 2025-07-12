// frontend/src/features/registration/RegistrationForm.tsx
import React, { useReducer } from 'react';
import { FormField } from '@/data/formData';
import { formReducer, initialFormState } from './formReducer';

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
        <form onSubmit={handleSubmit}>
            {fields.map((field) => (
                <div key={field.name} className="mb-4">
                    <label htmlFor={field.name} className="block font-medium">
                        {field.label}
                    </label>

                    <input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        value={
                            field.type === 'checkbox'
                                ? undefined
                                : (state[field.name] as string | number)
                        }
                        checked={
                            field.type === 'checkbox'
                                ? (state[field.name] as boolean)
                                : undefined
                        }
                        required={field.required}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded border px-2 py-1 ${
                            field.type === 'checkbox' ? '' : ''
                        }`}
                    />
                </div>
            ))}

            <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white"
            >
                Register
            </button>
        </form>
    );
};

export default RegistrationForm;
