// frontend/src/features/registration/FieldFactory.tsx
//
// React field renderer for the registration form.
// - Accepts a FormField definition, current state, and handlers for checkbox/input changes.
// - Renders three kinds of UI:
//   - section: displays a Section header component.
//   - checkbox: renders a Checkbox with disabled logic for hasProxy when proxy fields already contain text.
//   - text-like inputs (text, email, phone, number): renders a labeled Input.
// - Error + missing handling:
//   - Computes hasError and isFieldMissing; applies red highlight class when either is true.
//   - Associates an aria-describedby with an inline <Message> when an error exists.
// - Accessibility & semantics:
//   - Sets aria-required, aria-invalid, and proper htmlFor/id wiring for labels and controls.
//   - For the id field, forces read-only behavior and prevents onChange updates.
// - Value safety:
//   - Ensures controlled inputs by converting undefined/null to empty string and preserving numbers as-is.
//

import React from 'react';
import {FormField} from '@/data/registrationFormData';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox-wrapper';
import {Section} from '@/components/ui/section';
import {Message} from '@/components/ui/message';

type Props = {
    field: FormField;
    state: Record<string, any>;
    isMissing: (name: string) => boolean;
    onCheckboxChange: (name: string, value: boolean | 'indeterminate' | undefined) => void;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
};

export function FieldRenderer({ field, state, isMissing, onCheckboxChange, onInputChange, error }: Props) {

    if (field.type === 'section') {
        return <Section key={`section-${field.label}`}>{field.label}</Section>;
    }

    if (field.type === 'checkbox') {
        const isDisabled =
            field.name === 'hasProxy' &&
            Boolean(
                [state.proxyName, state.proxyPhone, state.proxyEmail].some(
                    (v: unknown) => typeof v === 'string' && v.trim() !== ''
                )
            );

        const hasError = Boolean(error);
        const isFieldMissing = isMissing(field.name);
        const errorId = hasError ? `${field.name}-error` : undefined;
        const showErrorStyle = isFieldMissing || hasError;

        return (
            <>
                <Checkbox
                    key={field.name}
                    id={field.name}
                    name={field.name}
                    label={field.label}
                    checked={Boolean(state[field.name])}
                    onCheckedChange={(val) => onCheckboxChange(field.name, val)}
                    disabled={isDisabled}
                    aria-required={field.required}
                    aria-invalid={showErrorStyle}
                    aria-describedby={errorId}
                    className={showErrorStyle ? 'bg-red-100' : undefined}
                />
                {hasError && <Message id={errorId} text={error!} isError />}
            </>
        );
    }

    // text, email, phone, number
    const isReadOnly = field.name === 'id';
    const inputType = field.type;

    const hasError = Boolean(error);
    const isFieldMissing = isMissing(field.name);
    const errorId = hasError ? `${field.name}-error` : undefined;
    const showErrorStyle = isFieldMissing || hasError;

    // Null-safe value: keep inputs controlled without passing null/undefined
    const raw = state[field.name];
    const safeValue = typeof raw === 'number' ? raw : (raw ?? '');

    return (
        <div key={field.name} className="flex flex-col gap-1">
            <Label htmlFor={field.name}>
                {field.label}
                {field.required && <sup className="text-red-500">*</sup>}
            </Label>
            <Input
                id={field.name}
                name={field.name}
                type={inputType}
                value={safeValue}
                onChange={(e) => {
                    if (isReadOnly) return;
                    onInputChange(e);
                }}
                readOnly={isReadOnly}
                required={field.required}
                aria-required={field.required}
                aria-invalid={showErrorStyle}
                aria-describedby={errorId}
                className={showErrorStyle ? 'bg-red-100' : undefined}
            />
            {hasError && <Message id={errorId} text={error!} isError />}
        </div>
    );
}
