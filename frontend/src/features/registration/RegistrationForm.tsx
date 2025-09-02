// frontend/src/features/registration/RegistrationForm.tsx

import React, {useEffect, useMemo, useReducer, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, Eye, EyeOff, Copy} from 'lucide-react';

import {FormField} from '@/data/registrationFormData';
import {formReducer, initialFormState} from './formReducer';
import {generatePin} from '@/features/registration/utils';

import {Button} from '@/components/ui/button';
import {Message} from '@/components/ui/message';
import AppLayout from '@/components/layout/AppLayout';
import {Input} from '@/components/ui/input';

import {useMissingFields} from '@/hooks/useMissingFields';
import {FieldRenderer} from './FieldFactory';
import {apiFetch} from '@/lib/api';

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
const INTERNAL_ERROR_MSG = 'Oh snap! Something went wrong. Please contact us, or try again later.';

type MessageType = '' | 'success' | 'error';

type RegistrationFormProps = {
    fields: FormField[];
    initialData?: Record<string, any>;
    csrfToken?: string;
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({fields, initialData, csrfToken}) => {
    // Reducer-backed form state
    const [state, dispatch] = useReducer(
        formReducer,
        {...initialFormState(fields), ...(initialData || {})}
    );

    const [submitting, setSubmitting] = useState(false);

    // UI flags
    const [showId, setShowId] = useState(Boolean(initialData?.id));
    const [isSaved, setIsSaved] = useState(Boolean(initialData?.id));
    const [message, setMessage] = useState<{ text: string; type: MessageType }>({text: '', type: ''});

    // PIN UI
    const [pinRevealed, setPinRevealed] = useState(false);
    const [copied, setCopied] = useState(false);

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

    /* Only the fields marked visible are rendered. */
    const fieldsForRender = useMemo(
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

    // --- Effects ---------------------------------------------------------------

    // Generate a PIN if missing (first render / new form)
    useEffect(() => {
        if (!state.loginPin || String(state.loginPin).trim() === '') {
            const pin = generatePin(8);
            dispatch({type: 'CHANGE_FIELD', name: 'loginPin', value: pin});
            setPinRevealed(false);
        }
    }, [state.loginPin]);

    // Enforce proxy consistency: if proxy data exists, hasProxy must be true
    useEffect(() => {
        if (proxyDataPresent && !state.hasProxy) {
            dispatch({type: 'CHANGE_FIELD', name: 'hasProxy', value: true});
        }
    }, [proxyDataPresent, state.hasProxy]);

    // --- Handlers --------------------------------------------------------------

    const validateField = (name: string, value: unknown): string => {
        // No format error for PIN here; user can see/copy/edit it if needed
        if (name === 'loginPin') return '';

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

    // Copy PIN to clipboard
    const handleCopyPin = async () => {
        try {
            await navigator.clipboard.writeText(String(state.loginPin || ''));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    // --- Submit ---------------------------------------------------------------

    const validateAll = (): string[] => {
        const newErrors: Record<string, string> = {};
        for (const field of fieldsForRender) {
            const err = validateField(field.name, state[field.name]);
            if (err) newErrors[field.name] = err;
        }
        setErrors(newErrors);
        return Object.keys(newErrors);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setMessage({ text: '', type: '' });

        const invalid = validateAll();
        if (invalid.length > 0) {
            document.getElementById(invalid[0])?.focus();
            setMessage({ text: 'Please review the form for errors.', type: 'error' });
            return;
        }

        // Compute required + missing using rules
        const requiredNames = getRequiredFieldNames(fieldsForRender, state);
        const missing = findMissingRequiredFields(requiredNames, state);
        if (missing.length > 0) {
            markMissing(missing);
            document.getElementById(missing[0])?.focus();
            setMessage({ text: 'Please review the form for missing information.', type: 'error' });
            return;
        }

        setSubmitting(true);

        try {
            const isUpdate = !!state.id;
            const url = isUpdate ? `/api/registrations/${state.id}` : `/api/registrations`;
            const method: 'POST' | 'PUT' = isUpdate ? 'PUT' : 'POST';

            // Build payload; never send id; on CREATE, also avoid sending any client PIN
            const { id, loginPin, ...rest } = state as any;
            const payload = isUpdate ? { ...rest } : { ...rest, loginPin: undefined };

            const data = await apiFetch(
                url,
                { method, body: JSON.stringify(payload) },
                // only send CSRF on authenticated updates
                isUpdate ? csrfToken : undefined
            );

            if (!isUpdate) {
                // Expecting { id, loginPin } on create
                if (data?.id) dispatch({ type: 'CHANGE_FIELD', name: 'id', value: data.id });
                if (data?.loginPin) dispatch({ type: 'CHANGE_FIELD', name: 'loginPin', value: data.loginPin });
                setShowId(true);
                setIsSaved(true);
                setMessage({ text: 'Registration saved successfully.', type: 'success' });
            } else {
                // PUT returns { registration: {...} }
                if (data?.registration) {
                    Object.entries(data.registration).forEach(([k, v]: any) =>
                        dispatch({ type: 'CHANGE_FIELD', name: k, value: v })
                    );
                }
                setMessage({ text: 'Registration updated successfully.', type: 'success' });
            }
        } catch (err: any) {
            const server = err?.data;
            if (server && Array.isArray(server.missing) && server.missing.length > 0) {
                markMissing(server.missing as string[]);
                document.getElementById(server.missing[0])?.focus();
            }
            console.error('Registration error:', err);
            setMessage({ text: INTERNAL_ERROR_MSG, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const isError = message.type === 'error';
    const errorFor = (f: FormField) => errors[f.name];

    // --- Render ---------------------------------------------------------------

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

                {fieldsForRender.map((field) => {
                    let hr = null;
                    if (field.type === 'section') {
                        hr = <hr className="my-4"/>;
                    }

                    // Special-case render for the PIN field, but still inside the abstracted loop
                    if (field.type === 'pin') {
                        return (
                            <React.Fragment key={`${field.type}-${field.name}-${field.label}`}>
                                {hr}
                                <div className="space-y-1">
                                    <label htmlFor="loginPin" className="text-sm font-medium">
                                        {field.label}{field.required ? <sup className="text-red-500">*</sup> : null}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="loginPin"
                                            name="loginPin"
                                            type={pinRevealed ? 'text' : 'password'}
                                            value={String(state.loginPin || '')}
                                            onChange={handleInputChange}
                                            readOnly={false} // allow user edits if they prefer a different PIN
                                            autoComplete="off"
                                            className="font-mono"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setPinRevealed(v => !v)}
                                            aria-pressed={pinRevealed}
                                            title={pinRevealed ? 'Hide PIN' : 'Reveal PIN'}
                                        >
                                            {pinRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleCopyPin}
                                            disabled={!state.loginPin}
                                            title={copied ? 'Copied!' : 'Copy PIN to clipboard'}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Keep this PIN somewhere safe. You’ll need it to update your registration.
                                    </p>
                                </div>
                            </React.Fragment>
                        );
                    }

                    // Default render for all other field types
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
                })}

                <hr className="my-4"/>
                <div className="flex items-center gap-2">
                    <Button type="submit" disabled={submitting}>
                        {submitting
                            ? (isSaved ? 'Updating…' : 'Registering…')
                            : (isSaved ? 'Update Registration' : 'Register')}
                    </Button>
                    {message.text && <Message text={message.text} isError={isError}/>}
                </div>
            </form>
        </AppLayout>
    );
};

export default RegistrationForm;
