// frontend/src/features/registration/FieldFactory.tsx
//

import React from 'react';
import {FormField} from '@/data/registrationFormData';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox-wrapper';
import {Section} from '@/components/ui/section';

type Props = {
    field: FormField;
    state: Record<string, any>;
    isMissing: (name: string) => boolean;
    onCheckboxChange: (name: string, value: boolean | 'indeterminate' | undefined) => void;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function FieldRenderer({field, state, isMissing, onCheckboxChange, onInputChange}: Props) {
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

        return (
            <Checkbox
                key={field.name}
                id={field.name}
                name={field.name}
                label={field.label}
                checked={Boolean(state[field.name])}
                onCheckedChange={(val) => onCheckboxChange(field.name, val)}
                disabled={isDisabled}
                className={isMissing(field.name) ? 'bg-red-100' : undefined}
            />
        );
    }

    // text, email, phone, number, pin
    const isReadOnly = field.type === 'pin' || field.name === 'id';
    const inputType = field.type === 'pin' ? 'text' : field.type;

    return (
        <div key={field.name} className="flex flex-col gap-1">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
                id={field.name}
                name={field.name}
                type={inputType}
                value={state[field.name] as string | number}
                onChange={onInputChange}
                readOnly={isReadOnly}
                className={isMissing(field.name) ? 'bg-red-100' : undefined}
            />
        </div>
    );
}
