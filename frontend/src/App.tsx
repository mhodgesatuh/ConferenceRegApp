// frontend/src/App.tsx

import React, { useCallback } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import RegistrationPage from './features/registration/RegistrationPage';
import AdminRegistrationPage from './features/registration/AdminRegistrationPage';
import HomePage from './features/home/HomePage';
import AdministrationPage from './features/administration/AdministrationPage';
import AppLayout from '@/components/layout/AppLayout';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { hasAdminPrivileges } from './features/auth/adminPrivileges';

type LoginSuccessPayload = {
    registration?: any;
};

const AppRoutes: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLoginSuccess = useCallback(
        ({ registration }: LoginSuccessPayload) => {
            if (!registration) return;

            login(registration);

            const target = hasAdminPrivileges(registration) ? '/organizer' : '/register';
            navigate(target, { state: { registration } });
        },
        [login, navigate],
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
            <AuthProvider>
                <AppLayout>
                    <AppRoutes />
                </AppLayout>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
