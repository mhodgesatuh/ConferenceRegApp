// frontend/src/hooks/useMissingFields.ts
//
// Hook for managing missing required fields in a form.
//

import { useState } from 'react';

export function useMissingFields() {

    const [missing, setMissing] = useState<string[]>([]);

    // Replace the missing field list with a new array of field names.
    const markMissing = (fields: string[]) => {
        setMissing(fields);
    };

    // Remove a field from the missing list once it's filled in.
    const clearMissing = (name: string) => {
        setMissing((prev) => prev.filter((n) => n !== name));
    };

    // Return true if the given field is marked as missing.
    const isMissing = (name: string) => {
        return missing.includes(name);
    };

    return { markMissing, clearMissing, isMissing };
}
