// frontend/src/hooks/useValidationTableOptions.ts

import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";

function toSnakeCase(s: string): string {
    // Converts lunchMenu / lunch-menu / Lunch_Menu -> lunch_menu
    return s
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();
}

export interface ValidationTableState {
    options: string[];
    isLoading: boolean;
    error: string | null;
}

export function useValidationTableOptions(table?: string): ValidationTableState {
    const [options, setOptions] = useState<string[]>([]);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!table) {
            setOptions([]);
            setError(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const init: RequestInit = {
                    method: 'GET',
                    signal: controller.signal,
                };
                const key = toSnakeCase(table);
                const data = await apiFetch(`/api/validation-tables/${encodeURIComponent(key)}`, init);
                if (cancelled) return;
                const values = Array.isArray(data?.values)
                    ? data.values.map((v: unknown) => String(v))
                    : [];
                setOptions(values);
            } catch (err: any) {
                if (cancelled) return;
                const status: number | undefined = typeof err?.status === 'number' ? err.status : undefined;
                const code = err?.data?.error;

                if (status === 404 || code === 'validation_table_not_found') {
                    setOptions([]);
                    setError(null);
                } else {
                    const message = code || err?.message || 'Failed to load options';
                    setError(message);
                    setOptions([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [table]);

    return { options, isLoading, error };
}
