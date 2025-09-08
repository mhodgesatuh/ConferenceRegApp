// frontend/src/features/organizer/OrganizerPage.tsx

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type LocationState = { registration?: any };

const OrganizerPage: React.FC = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { registration } = (state as LocationState) || {};

    const goUpdate = () => navigate("/register", { state: { registration } });
    const goList = () => navigate("/registrations/list");

    return (
        <div className="space-y-4">
            <header className="pb-2 mb-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <Link to="/home" className="flex items-center gap-1 text-primary hover:underline">
                        <ArrowLeft className="h-4 w-4" />
                        Home
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-semibold text-center w-full">
                        Organizer Options
                    </h1>
                </div>
            </header>

            <div className="flex flex-col gap-2">
                <Button onClick={goUpdate}>Update My Registration</Button>
                <Button onClick={goList}>List Registrations</Button>
            </div>
        </div>
    );
};

export default OrganizerPage;

