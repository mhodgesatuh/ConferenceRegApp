// components/ui/checkbox-wrapper.tsx
//
// Functions:
// - Checkbox followed by clickable label
// - Prop to conditionally disable the checkbox
//

import * as React from 'react';
import { Checkbox as PrimitiveCheckbox } from './checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface CheckboxWrapperProps
    extends React.ComponentPropsWithoutRef<typeof PrimitiveCheckbox> {
    label?: string;
    id?: string;
    disableUnless?: boolean;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxWrapperProps>(
    ({ className, label, id, disableUnless, disabled, ...props }, ref) => {
        const checkboxId = id || React.useId();

        // Honor explicit `disabled` first; otherwise disable unless condition is true.
        const isDisabled =
            disabled ?? (disableUnless !== undefined ? !disableUnless : false);

        return (
            <div
                className={cn(
                    'flex items-center space-x-2',
                    isDisabled && 'opacity-60 cursor-not-allowed pointer-events-none select-none'
                )}
            >
                <PrimitiveCheckbox
                    id={checkboxId}
                    ref={ref}
                    disabled={isDisabled}
                    className={cn('shrink-0', className)}
                    {...props}
                />
                {label && (
                    <Label
                        htmlFor={isDisabled ? undefined : checkboxId}
                        onClick={isDisabled ? (e) => e.preventDefault() : undefined}
                        className={cn('text-sm', isDisabled ? 'text-gray-400' : 'text-gray-900')}
                    >
                        {label}
                    </Label>
                )}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';
