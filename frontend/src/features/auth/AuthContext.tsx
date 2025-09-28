// frontend/src/features/auth/AuthContext.tsx

import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import {apiFetch, clearCsrf} from "@/lib/api";

export interface AuthContextValue {
    registration: Record<string, any> | null;
    isOrganizer: boolean;
    loading: boolean;
    login: (registration: Record<string, any>) => void;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
    setRegistration: (registration: Record<string, any> | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function safeGetSessionId(): number | null {
    try {
        const raw = sessionStorage.getItem("regId");
        if (!raw) return null;
        const parsed = Number(raw);
        return Number.isNaN(parsed) ? null : parsed;
    } catch {
        return null;
    }
}

function persistRegistration(registration: Record<string, any> | null) {
    try {
        if (registration && registration.id != null) {
            sessionStorage.setItem("regId", String(registration.id));
            sessionStorage.setItem(
                "regIsOrganizer",
                registration.isOrganizer ? "true" : "false"
            );
        } else {
            sessionStorage.removeItem("regId");
            sessionStorage.removeItem("regIsOrganizer");
        }
    } catch {
        // Ignore storage errors (e.g., Safari private mode)
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [registration, setRegistrationState] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const applyRegistration = useCallback((reg: Record<string, any> | null) => {
        setRegistrationState(reg);
        persistRegistration(reg);
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        const sessionId = safeGetSessionId();
        if (!sessionId) {
            applyRegistration(null);
            setLoading(false);
            return;
        }

        try {
            const data = await apiFetch(`/api/registrations/${sessionId}`, { method: "GET" });
            if (data?.registration) {
                applyRegistration(data.registration);
            } else {
                applyRegistration(null);
            }
        } catch {
            applyRegistration(null);
        } finally {
            setLoading(false);
        }
    }, [applyRegistration]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const login = useCallback(
        (reg: Record<string, any>) => {
            applyRegistration(reg);
            setLoading(false);
        },
        [applyRegistration]
    );

    const logout = useCallback(async () => {
        try {
            await apiFetch("/api/session/logout", { method: "POST" });
        } catch {
            // Ignore logout errors; we'll clear client state regardless.
        }
        clearCsrf();
        applyRegistration(null);
        setLoading(false);
    }, [applyRegistration]);

    const value = useMemo<AuthContextValue>(
        () => ({
            registration,
            isOrganizer: Boolean(registration?.isOrganizer),
            loading,
            login,
            logout,
            refresh,
            setRegistration: applyRegistration,
        }),
        [registration, loading, login, logout, refresh, applyRegistration]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}
