// frontend/src/features/registration/RegistrationPage.tsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RegistrationForm from "./RegistrationForm";
import { registrationFormData } from "@/data/registrationFormData";
import { apiFetch } from "@/lib/api";

type LocationState = { registration?: any };

const RegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { registration } = (location.state as LocationState) || {};
    const [initialData, setInitialData] = useState<any | undefined>(registration);

    // Fallback on refresh: if we have an id but no data, try refetch using session
    useEffect(() => {
        const tryRefetch = async () => {
            if (initialData?.id) return;              // already have it
            const idFromState = registration?.id ?? Number(sessionStorage.getItem("regId"));
            if (!idFromState) return;

            try {
                // GET is auth-only (no CSRF required in your backend)
                const data = await apiFetch(`/api/registrations/${idFromState}`, { method: "GET" });
                // backend returns { registration: {...} }
                if (data?.registration) setInitialData(data.registration);
            } catch {
                // if session expired or not found, send them back home
                navigate("/home");
            }
        };
        tryRefetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registration, navigate]);

    // If neither state nor refetch worked, render an empty form (new registration) or redirect
    // Here we just render; your form handles create vs update based on presence of id
    return <RegistrationForm fields={registrationFormData} initialData={initialData} />;
};

export default RegistrationPage;
