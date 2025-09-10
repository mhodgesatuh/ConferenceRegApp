// frontend/src/features/administration/types.ts

// A permissive shape for registration rows.
// Keep core identity 'id' required; everything else is open-ended.
// (If you later want stricter typing, centralize it here.)
export type Registration = {
    id: number;
} & Record<string, any>;
