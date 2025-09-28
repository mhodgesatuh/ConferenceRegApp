// frontend/src/features/administration/hooks/useRegistrations.ts
//
// Custom React hook for fetching admin registrations.
// - Manages local state: data (Registration[]), isLoading, and error.
// - load(): async fetch of /api/registrations via apiFetch; updates data/error and toggles loading.
// - useEffect(): calls load() on mount (and when its reference changes).
// - reload(): stable callback to manually re-run load().
// - byId(id): convenience finder that returns a registration matching the numeric id from in-memory data.
//   - Returns a memoized object { data, setData, isLoading, error, reload, byId } to minimize re-renders.
//

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Registration } from "../types";

export function useRegistrations() {
    const [data, setData] = useState<Registration[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [errorStatus, setErrorStatus] = useState<number | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setErrorStatus(null);
        try {
            const res = await apiFetch("/api/registrations");
            setData(res?.registrations ?? []);
        } catch (e: any) {
            const msg = e?.data?.error || e?.message || "Failed to load registrations";
            setError(msg);
            setErrorStatus(typeof e?.status === "number" ? e.status : null);
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
        () => ({ data, setData, isLoading, error, errorStatus, reload, byId }),
        [data, isLoading, error, errorStatus, reload, byId]
    );
}
