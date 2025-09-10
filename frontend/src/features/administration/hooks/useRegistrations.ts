// frontend/src/features/administration/hooks/useRegistrations.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Registration } from "../types";

export function useRegistrations() {
    const [data, setData] = useState<Registration[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await apiFetch("/api/registrations");
            setData(res?.registrations ?? []);
        } catch (e: any) {
            const msg = e?.data?.error || e?.message || "Failed to load registrations";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const reload = useCallback(() => load(), [load]);

    // convenience helpers
    const byId = useCallback(
        (id: number) => data.find((r) => Number(r.id) === Number(id)),
        [data]
    );

    return useMemo(
        () => ({ data, setData, isLoading, error, reload, byId }),
        [data, isLoading, error, reload, byId]
    );
}
