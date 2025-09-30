// frontend/src/features/registration/RegistrationPage.tsx

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import type {Registration} from "@/features/administration/types";

import RegistrationForm from "./RegistrationForm";
import {registrationFormData} from "@/data/registrationFormData";
import {apiFetch} from "@/lib/api";
import {useAuth} from "@/features/auth/AuthContext";

type LocationState = { registration?: any };

function asRegistration(x: unknown): Registration | undefined {
    return x && typeof (x as any).id === "number" ? (x as Registration) : undefined;
}

const RegistrationPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { registration: stateRegistration } = (location.state as LocationState) || {};
    const { registration: authRegistration, setRegistration } = useAuth();
    const [initialData, setInitialData] = useState<Registration | undefined>(
        asRegistration(stateRegistration) ?? asRegistration(authRegistration)
    );
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
        if (asRegistration(authRegistration)) {
            setInitialData((prev) => prev ?? (authRegistration as Registration));
        }
    }, [stateRegistration, authRegistration]);

    useEffect(() => {
        const tryRefetch = async () => {
            const idToLoad = stateRegistration?.id ?? authRegistration?.id ?? storedId;
            if (!idToLoad || initialData?.id === idToLoad) return;

            try {
                const data = await apiFetch(`/api/registrations/${idToLoad}`, { method: "GET" });
                if (data?.registration && typeof data.registration.id === "number") {
                    setInitialData(data.registration as Registration);
                }
            } catch {
                try {
                    sessionStorage.removeItem("regId");
                } catch {
                }
                setInitialData(undefined); // fall back to brand-new form
                setRegistration(null);
                navigate("/home", { replace: true });
            }
        };
        tryRefetch();
    }, [stateRegistration, authRegistration?.id, storedId, initialData?.id, navigate, setRegistration]);

    const handleSaved = useCallback(
        (regData: Registration) => {
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
