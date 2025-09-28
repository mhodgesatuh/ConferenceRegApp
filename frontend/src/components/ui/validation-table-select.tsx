// frontend/src/components/ui/validation-table-select.tsx

import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

export const ValidationTableSelect: React.FC<ValidationTableSelectProps> = ({
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

    return (
        <Select
            value={normalizedValue}
            onValueChange={(next) => onChange(next === '' ? null : next)}
            disabled={disabled || isLoading}
        >
            <SelectTrigger id={id} className={className ?? 'w-full'} {...ariaProps}>
                <SelectValue placeholder={resolvedPlaceholder} />
            </SelectTrigger>
            <SelectContent>
                {allowClear && (
                    <SelectItem value="">
                        None
                    </SelectItem>
                )}
                {options.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                        {isLoading ? 'Loading…' : 'No options available'}
                    </SelectItem>
                ) : (
                    options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))
                )}
            </SelectContent>
        </Select>
    );
};
