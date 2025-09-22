// frontend/src/features/registration/RegistrationPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import RegistrationForm from "./RegistrationForm";
import { registrationFormData } from "@/data/registrationFormData";
import { apiFetch } from "@/lib/api";

type LocationState = { registration?: any };

const RegistrationPage: React.FC = () => {
    const location = useLocation();
    const { registration } = (location.state as LocationState) || {};
    const [initialData, setInitialData] = useState<any | undefined>(registration);

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
        const tryRefetch = async () => {
            const idToLoad = registration?.id ?? storedId;
            if (!idToLoad || initialData?.id === idToLoad) return;

            try {
                const data = await apiFetch(`/api/registrations/${idToLoad}`, { method: "GET" });
                if (data?.registration) setInitialData(data.registration);
            } catch {
                try { sessionStorage.removeItem("regId"); } catch {}
                setInitialData(undefined); // fall back to brand-new form
            }
        };
        tryRefetch();
    }, [registration, storedId, initialData?.id]);

    return <RegistrationForm fields={registrationFormData} initialData={initialData} />;
};

export default RegistrationPage;
