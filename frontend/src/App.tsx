// frontend/src/App.tsx

import RegistrationPage from './features/registration/RegistrationPage';
import HomePage from './features/home/HomePage';
import OrganizerPage from './features/organizer/OrganizerPage';
import ListRegistrationsPage from './features/organizer/ListRegistrationsPage';
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
                                    // optional: keep this if you also store regId for refresh elsewhere
                                    sessionStorage.setItem('regId', String(registration?.id ?? ''));
                                }}
                            />
                        }
                    />
                    <Route path="/register" element={<RegistrationPage />} />
                    <Route path="/organizer" element={<OrganizerPage />} />
                    <Route path="/registrations/list" element={<ListRegistrationsPage />} />
                </Routes>
            </AppLayout>
        </BrowserRouter>
    );
};

export default App;
