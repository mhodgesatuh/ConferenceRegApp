// frontend/src/features/registration/RegistrationPage.tsx

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import RegistrationForm from "./RegistrationForm";
import { registrationFormData } from "@/data/registrationFormData";
import { apiFetch } from "@/lib/api";

type LocationState = { registration?: any };

const RegistrationPage: React.FC = () => {
    const location = useLocation();
    const { registration } = (location.state as LocationState) || {};
    const [initialData, setInitialData] = useState<any | undefined>(registration);

    useEffect(() => {
        const tryRefetch = async () => {
            const idFromState = registration?.id;
            if (!idFromState || initialData?.id) return;

            try {
                const data = await apiFetch(`/api/registrations/${idFromState}`, { method: "GET" });
                if (data?.registration) setInitialData(data.registration);
            } catch {
                try { sessionStorage.removeItem("regId"); } catch {}
                setInitialData(undefined); // fall back to brand-new form
            }
        };
        tryRefetch();
    }, [registration, initialData?.id]);

    return <RegistrationForm fields={registrationFormData} initialData={initialData} />;
};

export default RegistrationPage;
