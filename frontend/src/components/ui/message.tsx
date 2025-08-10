// frontend/src/components/ui/message.tsx
//
// Features:
// - Change background color for success and error messages.
// - Allow message to be dismissed.
//

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from './utils';

export interface MessageProps {
    text: string;
    isError?: boolean;
}

export const Message: React.FC<MessageProps> = ({ text, isError = false }) => {
    const [visible, setVisible] = React.useState(true);
    const [closing, setClosing] = React.useState(false);

    // After fade-out completes, unmount
    React.useEffect(() => {
        if (!closing) return;
        const t = setTimeout(() => setVisible(false), 200); // match duration-200
        return () => clearTimeout(t);
    }, [closing]);

    if (!visible) return null;

    return (
        <div
            className={cn(
                'relative flex items-start gap-3 border rounded-md px-4 py-2',
                'transition-opacity duration-200 ease-out', // fade animation
                closing ? 'opacity-0' : 'opacity-100',
                isError
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-green-50 border-green-200 text-green-900'
            )}
            role="status"
            aria-live="polite"
        >
            <span className="flex-1">{text}</span>

            <button
                type="button"
                onClick={() => setClosing(true)}
                className={cn(
                    'shrink-0 rounded-md p-1',
                    'text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-ring'
                )}
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};

Message.displayName = 'Message';
