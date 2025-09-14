import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import RegistrationForm from "./RegistrationForm";
import { registrationFormData } from "@/data/registrationFormData";
import { apiFetch } from "@/lib/api";

const AdminRegistrationPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [initialData, setInitialData] = useState<any | undefined>(undefined);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const data = await apiFetch(`/api/registrations/${id}`, { method: "GET" });
                if (data?.registration) setInitialData(data.registration);
            } catch {
                setInitialData(undefined);
            }
        };
        fetchData();
    }, [id]);

    return (
        <RegistrationForm
            fields={registrationFormData}
            initialData={initialData}
            forceAdmin
            showHeader={false}
        />
    );
};

export default AdminRegistrationPage;
