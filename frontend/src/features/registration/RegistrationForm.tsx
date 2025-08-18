// frontend/src/features/registration/RegistrationForm.tsx
//

import React, {useEffect, useMemo, useReducer, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';

import {FormField} from '@/data/registrationFormData';
import {formReducer, initialFormState} from './formReducer';
import {generatePin} from '@/features/registration/utils';

import {Button} from '@/components/ui/button';
import {Message} from '@/components/ui/message';
import AppLayout from '@/components/layout/AppLayout';

import {useMissingFields} from '@/hooks/useMissingFields';
import {FieldRenderer} from './FieldFactory';

import {
    findMissingRequiredFields,
    getRequiredFieldNames,
    getVisibleFields,
    hasAnyProxyData,
    isValidEmail,
    isValidPhone,
    PROXY_FIELDS_SET,
    userHasUpdatePrivilege,
} from './formRules';

const PAGE_TITLE = 'Conference Registration';

const INTERNAL_ERROR_MSG = "Oh snap! Something went wrong. Please contact PCATT, or try again later.";

type MessageType = '' | 'success' | 'error';

type RegistrationFormProps = {
    fields: FormField[];
    initialData?: Record<string, any>;
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({fields, initialData}) => {
    // Reducer-backed form state
    const [state, dispatch] = useReducer(
        formReducer,
        {...initialFormState(fields), ...(initialData || {})}
    );

    // UI flags
    const [showId, setShowId] = useState(Boolean(initialData?.id));
    const [isSaved, setIsSaved] = useState(Boolean(initialData?.id));
    const [message, setMessage] = useState<{ text: string; type: MessageType }>({
        text: '',
        type: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Missing-field helper
    const {markMissing, clearMissing, isMissing} = useMissingFields();

    // Derived facts
    const hasUpdatePrivilege = useMemo(
        () => userHasUpdatePrivilege(fields, initialData),
        [fields, initialData]
    );

    const proxyDataPresent = useMemo(
        () => hasAnyProxyData(state),
        [state.proxyName, state.proxyPhone, state.proxyEmail]
    );

    const visibleFields = useMemo(
        () =>
            getVisibleFields({
                fields,
                state,
                hasUpdatePrivilege,
                isSaved,
                showId,
            }),
        [fields, state, hasUpdatePrivilege, isSaved, showId]
    );

    // Effects

    // Generate a PIN if missing (first render / new form)
    useEffect(() => {
        if (typeof state.loginPin === 'string' && state.loginPin === '') {
            dispatch({type: 'CHANGE_FIELD', name: 'loginPin', value: generatePin(8)});
        }
    }, [state.loginPin]);

    // Enforce proxy consistency: if proxy data exists, hasProxy must be true
    useEffect(() => {
        if (proxyDataPresent && !state.hasProxy) {
            dispatch({type: 'CHANGE_FIELD', name: 'hasProxy', value: true});
        }
    }, [proxyDataPresent, state.hasProxy]);

    // Handlers

    const validateField = (name: string, value: unknown): string => {
        const field = fields.find((f) => f.name === name);
        if (!field) return '';
        const str = String(value);
        if (field.type === 'email') {
            return str.trim() && !isValidEmail(str) ? 'Invalid email address' : '';
        }
        if (field.type === 'phone') {
            return str.trim() && !isValidPhone(str) ? 'Invalid phone number' : '';
        }
        return '';
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, type, value, valueAsNumber} = e.target;
        const parsed = type === 'number' ? (isNaN(valueAsNumber) ? 0 : valueAsNumber) : value;
        clearMissing(name);
        dispatch({type: 'CHANGE_FIELD', name, value: parsed});
        const error = validateField(name, parsed);
        setErrors((prev) => {
            const {[name]: _removed, ...rest} = prev;
            return error ? {...rest, [name]: error} : rest;
        });
    };

    const handleCheckboxChange = (name: string, value: boolean | 'indeterminate' | undefined) => {
        const checked = Boolean(value);

        // Don’t allow unchecking hasProxy if proxy details exist
        if (name === 'hasProxy' && proxyDataPresent && !checked) return;

        // Pair rule: day1/day2 — clear missing from both if either toggled
        if (name === 'day1Attendee' || name === 'day2Attendee') {
            clearMissing('day1Attendee');
            clearMissing('day2Attendee');
        } else {
            clearMissing(name);
        }

        // Clear proxy fields if proxy turned off
        if (name === 'hasProxy' && !checked) {
            PROXY_FIELDS_SET.forEach((field) => {
                clearMissing(field);
                dispatch({type: 'CHANGE_FIELD', name: field, value: ''});
                setErrors((prev) => {
                    const {[field]: _removed, ...rest} = prev;
                    return rest;
                });
            });
        }

        dispatch({type: 'CHANGE_FIELD', name, value: checked});
    };

    // Submit

    const validateAll = (): string[] => {
        const newErrors: Record<string, string> = {};
        for (const field of visibleFields) {
            const err = validateField(field.name, state[field.name]);
            if (err) newErrors[field.name] = err;
        }
        setErrors(newErrors);
        return Object.keys(newErrors);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const invalid = validateAll();
        if (invalid.length > 0) {
            document.getElementById(invalid[0])?.focus();
            setMessage({text: 'Please review the form for errors.', type: 'error'});
            return;
        }

        // Compute required + missing using rules
        const requiredNames = getRequiredFieldNames(visibleFields, state);
        const missing = findMissingRequiredFields(requiredNames, state);

        if (missing.length > 0) {
            markMissing(missing);
            document.getElementById(missing[0])?.focus();
            setMessage({text: 'Please review the form for missing information.', type: 'error'});
            return;
        }

        try {
            // Exclude read-only fields from payload if desired
            const {loginPin: _pin, id: _id, ...payload} = state;

            const res = await fetch('/api/registrations', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const data = await res.json().catch(() => ({} as any));
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
                // Robust error handling: prefer JSON { error, cause, missing }, else fall back to text
                const ct = res.headers.get('content-type') ?? '';
                let data: any = undefined;
                let msg = '';

                if (ct.includes('application/json')) {
                    data = await res.json().catch(() => undefined);
                    const dev = import.meta.env.MODE !== 'production';
                    msg =
                        (dev && (data?.cause || data?.error)) ||
                        data?.error || `(${res.status})`;
                } else {
                    // Non-JSON error bodies
                    msg = (await res.text().catch(() => '')) || `(${res.status})`;
                }

                // If server returned which fields were missing, reflect that in the UI
                if (data && Array.isArray(data.missing) && data.missing.length > 0) {
                    markMissing(data.missing as string[]);
                    document.getElementById(data.missing[0])?.focus();
                }

                console.error('Registration error: ', msg);
                setMessage({text: INTERNAL_ERROR_MSG, type: 'error'});
            }
        } catch (err) {
            console.error('Registration error: ', err);
            setMessage({text: INTERNAL_ERROR_MSG, type: 'error'});
        }
    };


    const isError = message.type === 'error';
    const errorFor = (f: FormField) => errors[f.name];

    // Render

    return (
        <AppLayout>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <header className="pb-2 mb-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <Link to="/home" className="flex items-center gap-1 text-primary hover:underline">
                            <ArrowLeft className="h-4 w-4"/>
                            Home
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-semibold text-center w-full">
                            {PAGE_TITLE}
                        </h1>
                    </div>
                </header>

                {(() => {
                    return visibleFields.map((field) => {
                        let hr = null;
                        if (field.type === 'section') {
                            hr = <hr className="my-4"/>;
                        }
                        return (
                            <React.Fragment key={`${field.type}-${field.name}-${field.label}`}>
                                {hr}
                                <FieldRenderer
                                    field={field}
                                    state={state}
                                    isMissing={isMissing}
                                    onCheckboxChange={handleCheckboxChange}
                                    onInputChange={handleInputChange}
                                    error={errorFor(field)}
                                />
                            </React.Fragment>
                        );
                    });
                })()}
                <hr className="my-4"/>
                <div className="flex items-center gap-2">
                    <Button type="submit">{isSaved ? 'Update Registration' : 'Register'}</Button>
                    {message.text && <Message text={message.text} isError={isError}/>}
                </div>
            </form>
        </AppLayout>
    );
};

export default RegistrationForm;
