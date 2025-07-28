// frontend/src/App.tsx

import RegistrationForm from './features/registration/RegistrationForm';
import HomePage from './features/home/HomePage';
import { registrationFormData } from '@/data/registrationFormData';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';

const App = () => {
    const [registration, setRegistration] = useState<Record<string, any> | undefined>(undefined);

    const RegistrationRoute = () => {
        const location = useLocation();
        const data = (location.state as any)?.registration || registration;
        return <RegistrationForm fields={registrationFormData} initialData={data} />;
    };

    return (
        <BrowserRouter>
            <AppLayout>
                <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<HomePage onSuccess={setRegistration} />} />
                    <Route path="/register" element={<RegistrationRoute />} />
                </Routes>
            </AppLayout>
        </BrowserRouter>
    );
};

export default App;
