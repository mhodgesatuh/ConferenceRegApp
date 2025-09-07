// frontend/src/features/registration/FieldFactory.tsx

import React from 'react';
import {FormField} from '@/data/registrationFormData';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox-wrapper';
import {Section} from '@/components/ui/section';
import {Message} from '@/components/ui/message';
import {Copy, Eye, EyeOff} from 'lucide-react';

type Props = {
    field: FormField;
    state: Record<string, any>;
    isMissing: (name: string) => boolean;
    onCheckboxChange: (name: string, value: boolean | 'indeterminate' | undefined) => void;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
};

export function FieldRenderer({ field, state, isMissing, onCheckboxChange, onInputChange, error }: Props) {
    const [pinVisible, setPinVisible] = React.useState(false);

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
                {hasError && <Message id={errorId} text={error!} isError/>}
            </>
        );
    }

    if (field.type === 'pin') {
        const pinValue = String(state[field.name] ?? '');
        const copyPin = () => navigator.clipboard.writeText(pinValue);

        const hasError = Boolean(error);
        const isFieldMissing = isMissing(field.name);
        const errorId = hasError ? `${field.name}-error` : undefined;
        const showErrorStyle = isFieldMissing || hasError;

        return (
            <div key={field.name} className="flex flex-col gap-1">
                <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <sup className="text-red-500">*</sup>}
                </Label>
                <div className="relative">
                    <Input
                        id={field.name}
                        name={field.name}
                        type={pinVisible ? 'text' : 'password'}
                        value={pinValue}
                        readOnly
                        required={field.required}
                        aria-required={field.required}
                        aria-invalid={showErrorStyle}
                        aria-describedby={errorId}
                        className={`${showErrorStyle ? 'bg-red-100' : ''} pr-16`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                        <button
                            type="button"
                            onClick={copyPin}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            aria-label="Copy PIN"
                            title="copy"
                        >
                            <Copy className="h-4 w-4"/>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPinVisible((v) => !v)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            aria-label={pinVisible ? 'Hide PIN' : 'Show PIN'}
                            title={pinVisible ? 'hide' : 'show'}
                        >
                            {pinVisible ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                    </div>
                </div>
                {hasError && <Message id={errorId} text={error!} isError/>}
            </div>
        );
    }

    // text, email, phone, number
    const isReadOnly = field.name === 'id';
    const inputType = field.type;

    const hasError = Boolean(error);
    const isFieldMissing = isMissing(field.name);
    const errorId = hasError ? `${field.name}-error` : undefined;
    const showErrorStyle = isFieldMissing || hasError;

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
                value={state[field.name] as string | number}
                onChange={onInputChange}
                readOnly={isReadOnly}
                required={field.required}
                aria-required={field.required}
                aria-invalid={showErrorStyle}
                aria-describedby={errorId}
                className={showErrorStyle ? 'bg-red-100' : undefined}
            />
            {hasError && <Message id={errorId} text={error!} isError/>}
        </div>
    );
}
