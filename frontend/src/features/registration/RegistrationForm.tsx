// frontend/src/features/registration/RegistrationForm.tsx

import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import PageTitle from "@/components/PageTitle";

import { FormField } from "@/data/registrationFormData";
import { formReducer, initialFormState } from "./formReducer";

import { Button, Message, TabsBar } from "@/components/ui";
import {useMissingFields} from "@/hooks/useMissingFields";
import {FieldRenderer} from "./FieldFactory";
import {apiFetch, primeCsrf} from "@/lib/api";
import type {Registration} from "@/features/administration/types";
import { camelToTitle } from "@/lib/strings";

import {
    findMissingRequiredFields,
    getRequiredFieldNames,
    getVisibleFields,
    hasAnyProxyData,
    isValidEmail,
    isValidPhone,
    PROXY_FIELDS_SET,
    PRESENTER_FIELDS_SET,
    userHasUpdatePrivilege,
} from './formRules';

const PAGE_TITLE = 'Conference Registration';
const INTERNAL_ERROR_MSG = 'Oh snap! Something went wrong. Please contact us, or try again later.';

type MessageType = '' | 'success' | 'error';

const asTrimmedString = (v: unknown) => (v == null ? "" : String(v).trim());

const normalizeForSubmit = (src: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(src)) {
        if (typeof v === "string") {
            const t = v.trim();
            out[k] = t === "" ? null : t;     // "" -> null for optional fields
        } else {
            out[k] = v;
        }
    }

    // If proxy is off, hard-null all proxy fields
    if (!out.hasProxy) {
        for (const f of PROXY_FIELDS_SET) out[f] = null;
    }

    if (!out.isPresenter) {
        for (const f of PRESENTER_FIELDS_SET) out[f] = null;
    }

    return out;
};

type RegistrationFormProps = {
    fields: FormField[];
    initialData?: Partial<Registration>;
    forceAdmin?: boolean;
    showHeader?: boolean;
    onSaved?: (registration: Registration) => void;
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({
                                                               fields,
                                                               initialData,
                                                               forceAdmin = false,
                                                               showHeader = true,
                                                               onSaved,
                                                           }) => {

    // Reducer-backed form state
    const [state, dispatch] = useReducer(
        formReducer,
        { ...initialFormState(fields), ...(initialData || {}) }
    );

    const [submitting, setSubmitting] = useState(false);

    // UI flags
    const [message, setMessage] = useState<{ text: string; type: MessageType }>({ text: '', type: '' });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Missing-field helper
    const { markMissing, clearMissing, isMissing } = useMissingFields();

    // Derived facts
    const hasUpdatePrivilege = useMemo(
        () => forceAdmin || userHasUpdatePrivilege(fields, initialData),
        [fields, initialData, forceAdmin]
    );

    const proxyDataPresent = useMemo(
        () => hasAnyProxyData(state),
        [state.proxyName, state.proxyPhone, state.proxyEmail]
    );

    /* Only the fields marked visible are rendered. */
    const hasExistingRegistration = Boolean(state.id);

    const fieldsForRender = useMemo(
        () =>
            getVisibleFields({
                fields,
                state,
                hasUpdatePrivilege,
                isSaved: hasExistingRegistration,
                showId: hasExistingRegistration,
            }),
        [fields, state, hasUpdatePrivilege, hasExistingRegistration]
    );

    // --- Effects ---------------------------------------------------------------

    // RESET + sanitize
    useEffect(() => {
        const base = initialFormState(fields);
        const merged = { ...base, ...(initialData || {}) };

        dispatch({ type: "RESET", initialState: merged });
    }, [initialData, fields]);

    // Enforce proxy consistency: if proxy data exists, hasProxy must be true
    useEffect(() => {
        if (proxyDataPresent && !state.hasProxy) {
            dispatch({ type: 'CHANGE_FIELD', name: 'hasProxy', value: true });
        }
    }, [proxyDataPresent, state.hasProxy]);

    // --- Handlers --------------------------------------------------------------

    const validateField = (name: string, value: unknown): string => {
        const field = fields.find((f) => f.name === name);
        if (!field) return "";

        const str = asTrimmedString(value);
        // empty = no format error
        if (!str) return "";

        if (field.type === "email") {
            return !isValidEmail(str) ? "Invalid email address" : "";
        }
        if (field.type === "phone") {
            return !isValidPhone(str) ? "Invalid phone number" : "";
        }
        return "";
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target;
        const { name, value } = target;
        const parsed = target instanceof HTMLInputElement && target.type === 'number'
            ? (isNaN(target.valueAsNumber) ? '' : target.valueAsNumber)
            : value;
        clearMissing(name);
        dispatch({ type: 'CHANGE_FIELD', name, value: parsed });
        const error = validateField(name, parsed);
        setErrors((prev) => {
            const { [name]: _removed, ...rest } = prev;
            return error ? { ...rest, [name]: error } : rest;
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
        if (name === "hasProxy" && !checked) {
            PROXY_FIELDS_SET.forEach((field) => {
                clearMissing(field);
                dispatch({ type: "CHANGE_FIELD", name: field, value: null });
                setErrors((prev) => {
                    const { [field]: _removed, ...rest } = prev;
                    return rest;
                });
            });
        }

        dispatch({ type: 'CHANGE_FIELD', name, value: checked });
    };

    const handleValueChange = (name: string, value: string | null) => {
        clearMissing(name);
        const nextValue = value ?? '';
        dispatch({ type: 'CHANGE_FIELD', name, value: nextValue });
        const error = validateField(name, nextValue);
        setErrors((prev) => {
            const { [name]: _removed, ...rest } = prev;
            return error ? { ...rest, [name]: error } : rest;
        });
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

            // Build payload; never send id
            const { id, ...rest } = state as any;

            // Normalize for both create & update so backend gets nulls, not ""
            const payload = normalizeForSubmit(rest);

            const data = await apiFetch(url, {
                method,
                body: JSON.stringify(payload),
            });

            if (!isUpdate) {
                if (data?.id) dispatch({ type: 'CHANGE_FIELD', name: 'id', value: data.id });

                // 👇 Prime CSRF so the very next PUT succeeds
                try {
                    await primeCsrf();
                } catch (e) {
                    console.warn("CSRF prime failed after create:", e);
                }

                setMessage({ text: 'Registration saved successfully.', type: 'success' });
                if (data?.id) {
                    const newRegistration: Registration = { ...(state as any), id: data.id };
                    onSaved?.(newRegistration);
                }
            } else {
                // PUT returns { registration: {...} }
                if (data?.registration) {
                    Object.entries(data.registration).forEach(([k, v]: any) =>
                        dispatch({ type: 'CHANGE_FIELD', name: k, value: v })
                    );
                }
                setMessage({ text: 'Registration updated successfully.', type: 'success' });
                if (data?.registration) {
                    onSaved?.(data.registration as Registration);
                }
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

    const sectionFields = useMemo(
        () => fieldsForRender.filter((field) => field.type === 'section'),
        [fieldsForRender]
    );

    const [activeSection, setActiveSection] = useState<string>('');

    useEffect(() => {
        if (sectionFields.length === 0) {
            setActiveSection('');
            return;
        }
        setActiveSection((prev) => {
            if (prev && sectionFields.some((section) => section.name === prev)) {
                return prev;
            }
            return sectionFields[0]?.name ?? '';
        });
    }, [sectionFields]);

    const handleSectionSelect = useCallback((sectionId: string) => {
        setActiveSection(sectionId);
        const target = typeof document !== 'undefined' ? document.getElementById(sectionId) : null;
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const sectionTabs = useMemo(
        () =>
            sectionFields.map((section) => ({
                id: `tab-${section.name}`,
                label: camelToTitle(section.name),
                onClick: () => handleSectionSelect(section.name),
                active: activeSection === section.name,
                ariaControls: section.name,
            })),
        [sectionFields, activeSection, handleSectionSelect]
    );

    // --- Render ---------------------------------------------------------------

    // --- Render ---------------------------------------------------------------
    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {showHeader && <PageTitle title={PAGE_TITLE} />}

            {sectionTabs.length > 0 && (
                <TabsBar
                    items={sectionTabs}
                    ariaLabel="Registration sections"
                    sticky
                    className="shadow-sm"
                />
            )}

            {fieldsForRender.map((field) => {
                const hr = field.type === 'section' ? <hr className="my-4" /> : null;

                return (
                    <React.Fragment key={`${field.type}-${field.name}-${field.label}`}>
                        {hr}
                        <FieldRenderer
                            field={field}
                            state={state}
                            isMissing={isMissing}
                            onCheckboxChange={handleCheckboxChange}
                            onInputChange={handleInputChange}
                            onValueChange={handleValueChange}
                            error={errorFor(field)}
                        />
                    </React.Fragment>
                );
            })}

            <hr className="my-4" />
            <div className="flex items-center gap-2">
                <Button type="submit" disabled={submitting}>
                    {submitting
                        ? (hasExistingRegistration ? 'Saving…' : 'Submitting…')
                        : (hasExistingRegistration ? 'Save Registration' : 'Submit Registration')}
                </Button>
                {message.text && <Message text={message.text} isError={isError} />}
            </div>
        </form>
    );
}

export default RegistrationForm;
