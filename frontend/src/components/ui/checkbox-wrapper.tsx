// components/ui/checkbox-wrapper.tsx

import * as React from 'react';
import { Checkbox as PrimitiveCheckbox } from './checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils'; // If you're using Shadcn's className util

export interface CheckboxWrapperProps
    extends React.ComponentPropsWithoutRef<typeof PrimitiveCheckbox> {
    label?: string;
    id?: string;
}

export const Checkbox = React.forwardRef<
    React.ElementRef<typeof PrimitiveCheckbox>,
    CheckboxWrapperProps
>(({ className, label, id, ...props }, ref) => {
    const checkboxId = id || React.useId();

    return (
        <div className="flex items-center space-x-2">
            <PrimitiveCheckbox
                id={checkboxId}
                ref={ref}
                className={cn('shrink-0', className)}
                {...props}
            />
            {label && (
                <Label htmlFor={checkboxId} className="text-sm text-gray-900">
                    {label}
                </Label>
            )}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';
