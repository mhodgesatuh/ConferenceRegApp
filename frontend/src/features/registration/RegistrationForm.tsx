// frontend/src/features/registration/RegistrationForm.tsx

import React, {useEffect, useReducer} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {FormField} from '@/data/registrationFormData';
import {formReducer, initialFormState} from './formReducer';
import {generatePin} from '@/features/registration/utils';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox-wrapper';
import {Section} from '@/components/ui/section';
import AppLayout from '@/components/layout/AppLayout';

const PAGE_TITLE = 'Conference Registration';

type RegistrationFormProps = {
    fields: FormField[];
    initialData?: Record<string, any>;
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({fields, initialData}) => {
    const visibleFields = initialData?.id
        ? fields
        : fields.filter((f) => f.name !== 'id');

    const [state, dispatch] = useReducer(
        formReducer,
        {...initialFormState(visibleFields), ...(initialData || {})}
    );

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
        const {name, type, value, valueAsNumber} = e.target;
        let parsed: string | number;

        switch (type) {
            case 'number':
                parsed = isNaN(valueAsNumber) ? 0 : valueAsNumber;
                break;
            default:
                parsed = value;
        }

        dispatch({type: 'CHANGE_FIELD', name, value: parsed});
    };

    const handleCheckboxChange = (
        name: string,
        value: boolean | 'indeterminate' | undefined
    ) => {
        dispatch({type: 'CHANGE_FIELD', name, value: Boolean(value)});
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
                            readOnly={field.type === 'pin' || field.name === 'id'}
                            required={field.required ?? false}
                        />
                    </div>
                );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const {loginPin: _pin, id: _id, ...payload} = state;
            const res = await fetch('/api/registrations', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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
        <AppLayout>
            <form onSubmit={handleSubmit} className="space-y-4">
                <header className="border-b pb-4 mb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <Link
                            to="/home"
                            className="flex items-center gap-1 text-primary hover:underline">
                            <ArrowLeft className="h-4 w-4"/>
                            Home
                        </Link>

                        <h1 className="text-xl sm:text-2xl font-semibold text-center w-full">
                            {PAGE_TITLE}
                        </h1>
                    </div>
                </header>


                {visibleFields.map(renderField)}

                <Button type="submit">Register</Button>
            </form>
        </AppLayout>
    );
};

export default RegistrationForm;
