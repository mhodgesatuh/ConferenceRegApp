import * as React from 'react';
import { cn } from './utils';

export interface MessageProps {
    text: string;
    isError?: boolean;
}

export const Message: React.FC<MessageProps> = ({ text, isError = false }) => (
    <div
        className={cn(
            'border border-input rounded-md px-4 py-2',
            isError ? 'bg-red-100' : 'bg-green-100'
        )}
    >
        {text}
    </div>
);

Message.displayName = 'Message';

