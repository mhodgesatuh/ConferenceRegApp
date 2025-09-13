// frontend/src/App.tsx

import RegistrationPage from './features/registration/RegistrationPage';
import HomePage from './features/home/HomePage';
import AdministrationPage from './features/administration/AdministrationPage';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

const App = () => {
    return (
        <BrowserRouter>
            <AppLayout>
                <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route
                        path="/home"
                        element={
                            <HomePage
                                onSuccess={({ registration }) => {
                                    try { sessionStorage.setItem('regId', String(registration?.id ?? '')); } catch {}
                                }}
                            />
                        }
                    />
                    <Route path="/register" element={<RegistrationPage />} />
                    <Route path="/organizer" element={<AdministrationPage />} />
                </Routes>
            </AppLayout>
        </BrowserRouter>
    );
};

export default App;
