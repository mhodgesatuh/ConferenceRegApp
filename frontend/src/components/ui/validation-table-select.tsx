// frontend/src/components/ui/validation-table-select.tsx

import React from 'react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';

export type ValidationTableSelectProps = {
    id?: string;
    value?: string | null;
    options: string[];
    onChange: (value: string | null) => void;
    placeholder?: string;
    disabled?: boolean;
    allowClear?: boolean;
    isLoading?: boolean;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
    className?: string;
};

export const ValidationTableSelect: React.FC<ValidationTableSelectProps> = (
    {
        id,
        value,
        options,
        onChange,
        placeholder = 'Select an option',
        disabled = false,
        allowClear = false,
        isLoading = false,
        className,
        ...ariaProps
    }) => {
    const normalizedValue = value ?? '';
    const resolvedPlaceholder = isLoading ? 'Loading…' : placeholder;

    // Normalize incoming options: coerce to strings, drop null/empty
    const safeOptions = options
        .filter((o) => o != null)
        .map((o) => String(o))
        .filter((o) => o.trim() !== '');

    return (
        <Select
            value={normalizedValue}
            onValueChange={(next) => {
                if (next === '' || next === '__clear') onChange(null);
                else onChange(next);
            }}
            disabled={disabled || isLoading}
        >
            <SelectTrigger id={id} className={className ?? 'w-full'} {...ariaProps}>
                <SelectValue placeholder={resolvedPlaceholder}/>
            </SelectTrigger>
            <SelectContent>
                {allowClear && (
                    // Radix requires non-empty item values
                    <SelectItem value="__clear">None</SelectItem>
                )}
                {safeOptions.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                        {isLoading ? 'Loading…' : 'No options available'}
                    </SelectItem>
                ) : (
                    safeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))
                )}
            </SelectContent>
        </Select>
    );
};
