// frontend/src/features/registration/RegistrationPage.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import RegistrationForm from "./RegistrationForm";
import { registrationFormData } from "@/data/registrationFormData";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";

type LocationState = { registration?: any };

const RegistrationPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { registration: stateRegistration } = (location.state as LocationState) || {};
    const { registration: authRegistration, setRegistration } = useAuth();
    const [initialData, setInitialData] = useState<any | undefined>(stateRegistration ?? authRegistration);

    const storedId = useMemo(() => {
        try {
            const raw = sessionStorage.getItem("regId");
            if (!raw) return undefined;
            const parsed = Number(raw);
            return Number.isNaN(parsed) ? undefined : parsed;
        } catch {
            return undefined;
        }
    }, []);

    useEffect(() => {
        if (stateRegistration) {
            setInitialData((prev) => prev ?? stateRegistration);
            return;
        }
        if (authRegistration) {
            setInitialData((prev) => prev ?? authRegistration);
        }
    }, [stateRegistration, authRegistration]);

    useEffect(() => {
        const tryRefetch = async () => {
            const idToLoad = stateRegistration?.id ?? authRegistration?.id ?? storedId;
            if (!idToLoad || initialData?.id === idToLoad) return;

            try {
                const data = await apiFetch(`/api/registrations/${idToLoad}`, { method: "GET" });
                if (data?.registration) setInitialData(data.registration);
            } catch {
                try { sessionStorage.removeItem("regId"); } catch {}
                setInitialData(undefined); // fall back to brand-new form
                setRegistration(null);
                navigate("/home", { replace: true });
            }
        };
        tryRefetch();
    }, [stateRegistration, authRegistration?.id, storedId, initialData?.id, navigate, setRegistration]);

    const handleSaved = useCallback(
        (regData: Record<string, any>) => {
            if (regData && regData.id != null) {
                setInitialData(regData);
                setRegistration(regData);
            }
        },
        [setRegistration]
    );

    return (
        <RegistrationForm
            fields={registrationFormData}
            initialData={initialData}
            onSaved={handleSaved}
        />
    );
};

export default RegistrationPage;
