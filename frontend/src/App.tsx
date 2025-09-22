// frontend/src/App.tsx

import React, { useCallback } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import RegistrationPage from './features/registration/RegistrationPage';
import AdminRegistrationPage from './features/registration/AdminRegistrationPage';
import HomePage from './features/home/HomePage';
import AdministrationPage from './features/administration/AdministrationPage';
import AppLayout from '@/components/layout/AppLayout';

type LoginSuccessPayload = {
    registration?: any;
};

const AppRoutes: React.FC = () => {
    const navigate = useNavigate();

    const handleLoginSuccess = useCallback(
        ({ registration }: LoginSuccessPayload) => {
            if (!registration) return;

            try {
                sessionStorage.setItem('regId', String(registration.id ?? ''));
            } catch {
                /* ignore sessionStorage failures */
            }

            const target = registration.isOrganizer ? '/organizer' : '/register';
            navigate(target, { state: { registration } });
        },
        [navigate],
    );

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage onSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/organizer" element={<AdministrationPage />} />
            <Route path="/admin/registrations/:id" element={<AdminRegistrationPage />} />
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AppLayout>
                <AppRoutes />
            </AppLayout>
        </BrowserRouter>
    );
};

export default App;
