// frontend/src/features/administration/hooks/useRegistrationById.ts

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Registration } from "../types";

export function useRegistrationById(id?: number | null) {
    const [data, setData] = useState<Registration | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [errorStatus, setErrorStatus] = useState<number | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        setErrorStatus(null);
        try {
            const res = await apiFetch(`/api/registrations/${id}`, { method: "GET" });
            setData(res?.registration ?? null);
        } catch (e: any) {
            const msg = e?.data?.error || e?.message || "Failed to load registration";
            setError(msg);
            setErrorStatus(typeof e?.status === "number" ? e.status : null);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void load();
    }, [load]);

    return { data, setData, isLoading, error, errorStatus, reload: load };
}
