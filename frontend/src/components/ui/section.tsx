import * as React from 'react';
import { cn } from './utils';

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-lg font-semibold mt-6 mb-2', className)}
      {...props}
    >
      {children}
    </div>
  )
);
Section.displayName = 'Section';
