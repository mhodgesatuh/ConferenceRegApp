// frontend/src/features/registration/RegistrationForm.tsx

import React, {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {FormField} from '@/data/registrationFormData';
import {generatePin, isInputField} from '@/features/registration/utils';
import {Button} from '@/components/ui/button';
import {Message} from '@/components/ui/message';
import AppLayout from '@/components/layout/AppLayout';
import {useMissingFields} from '@/hooks/useMissingFields';
import {useFormState} from './hooks/useFormState';
import {
    PAGE_TITLE,
    PROXY_FIELDS_SET
} from './constants';
import RegistrationInfoSection from './components/RegistrationInfoSection';
import ContactInfoSection from './components/ContactInfoSection';
import ProxyInfoSection from './components/ProxyInfoSection';
import AdminSection from './components/AdminSection';

type MessageType = '' | 'success' | 'error';

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
                .filter(isInputField)
                .filter((f) => f.priv === 'update')
                .some((f) => Boolean(initialData?.[f.name])),
        [fields, initialData]
    );

    // Track whether the form data has been successfully saved (based on
    // presence of an ID).
    const [isSaved, setIsSaved] = useState(Boolean(initialData?.id));

    // Hook for tracking names of required fields that are currently missing input.
    const { markMissing, clearMissing, isMissing } = useMissingFields();

    // Store the message text and type to display feedback to the user after
    // form submission.
    const [message, setMessage] = useState<{ text: string; type: MessageType }>({text: '', type: ''});

    const [state, dispatch] = useFormState(fields, initialData);

    // Determine if the form element is in scope for display purposes. See
    // data/registrationFormData.ts for more information.
    const visibleFields = useMemo(
        () =>
            fields.filter((f) => {
                if (isInputField(f)) {
                    if (!showId && f.name === 'id') return false;
                    if (!isSaved && ['isCancelled', 'cancelledAttendance'].includes(f.name)) return false;
                    if (!state.hasProxy && PROXY_FIELDS_SET.has(f.name)) return false;
                }
                return !(f.scope === 'admin' && !hasUpdatePrivilege);
            }),
        [fields, showId, hasUpdatePrivilege, state.hasProxy, isSaved]
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
    }, [state.loginPin, dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const requiredMissing = visibleFields
            .filter(isInputField)
            .filter((f) => f.required || (state.hasProxy && PROXY_FIELDS_SET.has(f.name)))
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

        if (!state.day1Attendee && !state.day2Attendee) {
            requiredMissing.push('day1Attendee', 'day2Attendee');
        }

        const uniqueMissing = Array.from(new Set(requiredMissing));

        if (uniqueMissing.length > 0) {
            markMissing(uniqueMissing);
            const firstMissing = uniqueMissing[0];
            document.getElementById(firstMissing)?.focus();
            setMessage({ text: 'Please review the form for missing information.', type: 'error' });
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
                const messageText = data.error ?? 'Failed to save registration';
                setMessage({ text: messageText, type: 'error' });
            }
        } catch (err) {
            console.error('Registration submission failed', err);
            setMessage({text: 'Failed to submit registration', type: 'error'});
        }
    };

    const isError = message.type === 'error';

    return (
        <AppLayout>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
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


                <RegistrationInfoSection
                    fields={visibleFields}
                    state={state}
                    dispatch={dispatch}
                    isMissing={isMissing}
                    clearMissing={clearMissing}
                />
                <ContactInfoSection
                    fields={visibleFields}
                    state={state}
                    dispatch={dispatch}
                    isMissing={isMissing}
                    clearMissing={clearMissing}
                />
                <ProxyInfoSection
                    fields={visibleFields}
                    state={state}
                    dispatch={dispatch}
                    isMissing={isMissing}
                    clearMissing={clearMissing}
                />
                <AdminSection
                    fields={visibleFields}
                    state={state}
                    dispatch={dispatch}
                    isMissing={isMissing}
                    clearMissing={clearMissing}
                />

                <div className="flex items-center gap-2">
                    <Button type="submit">
                        {isSaved ? 'Update Registration' : 'Register'}
                    </Button>
                    {message.text && (
                        <Message text={message.text} isError={isError} />
                    )}
                </div>
            </form>
        </AppLayout>
    );
};

export default RegistrationForm;
