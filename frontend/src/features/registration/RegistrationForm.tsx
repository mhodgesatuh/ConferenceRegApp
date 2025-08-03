// frontend/src/features/registration/RegistrationForm.tsx

import React, {useEffect, useMemo, useReducer, useState} from 'react';
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
import {Message} from '@/components/ui/message';
import AppLayout from '@/components/layout/AppLayout';

const PAGE_TITLE = 'Conference Registration';

// Type guard to ensure field.name is a string, required for field-safe rendering.
// See: data/registrationFormData.ts
function safeFieldName(field: FormField): field is FormField & { name: string } {
    return typeof field.name === 'string';
}

type RegistrationFormProps = {
    fields: FormField[];
    initialData?: Record<string, any>;
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({fields, initialData}) => {
    const [showId, setShowId] = useState(Boolean(initialData?.id));

    // Determine if the current user's registration data flags the user as
    // having admin 'update' privileges. See data/registrationFormData.ts for
    // more information.
    const hasUpdatePrivilege = useMemo(
        () =>
            fields
                .filter((f) => f.priv === 'update')
                .filter(safeFieldName)
                .some((f) => Boolean(initialData?.[f.name])),
        [fields, initialData]
    );

    const [isSaved, setIsSaved] = useState(Boolean(initialData?.id));
    const [missing, setMissing] = useState<string[]>([]);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({text: '', type: ''});

    // Determine if the form element is in scope for display purposes. See
    // data/registrationFormData.ts for more information.
    const visibleFields = useMemo(
        () =>
            fields
                .filter((f) => {
                    if (!showId && f.name === 'id') return false;
                    return !(f.scope === 'admin' && !hasUpdatePrivilege);
                })
                .filter(safeFieldName),
        [fields, showId, hasUpdatePrivilege]
    );

    const [state, dispatch] = useReducer(
        formReducer,
        {...initialFormState(visibleFields), ...(initialData || {})}
    );

    // Generate a pin for a new registration request.
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

        setMissing((prev) => prev.filter((n) => n !== name));
        dispatch({type: 'CHANGE_FIELD', name, value: parsed});
    };

    const handleCheckboxChange = (
        name: string,
        value: boolean | 'indeterminate' | undefined
    ) => {
        setMissing((prev) => prev.filter((n) => n !== name));
        dispatch({type: 'CHANGE_FIELD', name, value: Boolean(value)});
    };

    const renderField = (field: FormField & { name: string }) => {
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
                            className={missing.includes(field.name) ? 'bg-red-100' : undefined}
                        />
                    </div>
                );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const requiredMissing = visibleFields
            .filter((f) => f.required)
            .filter((f) => {
                const value = state[f.name];
                switch (typeof value) {
                    case 'string':
                        return value.trim() === '';
                    case 'number':
                        return value === 0;
                    case 'boolean':
                        return !value;
                    default:
                        return !value;
                }
            })
            .map((f) => f.name);

        if (requiredMissing.length > 0) {
            setMissing(requiredMissing);
            setMessage({text: 'Missing required information, see above.', type: 'error'});
            return;
        }

        try {
            const {loginPin: _pin, id: _id, ...payload} = state;
            const res = await fetch('/api/registrations', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data.id) {
                    dispatch({type: 'CHANGE_FIELD', name: 'id', value: data.id});
                    setShowId(true);
                    setIsSaved(true);
                }
                if (data.loginPin) {
                    dispatch({type: 'CHANGE_FIELD', name: 'loginPin', value: data.loginPin});
                }
                setMessage({text: 'Registration saved successfully.', type: 'success'});
            } else {
                const data = await res.json().catch(() => ({}));
                setMessage({text: data.error || 'Failed to save registration', type: 'error'});
            }
        } catch (err) {
            console.error('Registration submission failed', err);
            setMessage({text: 'Failed to submit registration', type: 'error'});
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

                <div className="flex items-center gap-2">
                    <Button type="submit">
                        {isSaved ? 'Update Registration' : 'Register'}
                    </Button>
                    {message.text && (
                        <Message
                            text={message.text}
                            isError={message.type === 'error'}
                        />
                    )}
                </div>
            </form>
        </AppLayout>
    );
};

export default RegistrationForm;
