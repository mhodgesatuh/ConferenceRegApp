// frontend/src/App.tsx

import RegistrationForm from './features/registration/RegistrationForm';
import HomePage from './features/home/HomePage';
import {registrationFormData} from '@/data/registrationFormData';
import {BrowserRouter, Navigate, Route, Routes, useLocation} from 'react-router-dom';
import {useState} from 'react';
import AppLayout from '@/components/layout/AppLayout';

const App = () => {
    const [registration, setRegistration] = useState<Record<string, any> | undefined>(undefined);
    const [csrf, setCsrf] = useState<string | undefined>(undefined);

    const RegistrationRoute = () => {
        const location = useLocation();
        const data = (location.state as any)?.registration || registration;
        const token = (location.state as any)?.csrf || csrf;
        return <RegistrationForm fields={registrationFormData} initialData={data} csrfToken={token}/>;
    };

    return (
        <BrowserRouter>
            <AppLayout>
                <Routes>
                    <Route path="/" element={<Navigate to="/home" replace/>}/>
                    <Route path="/home" element={<HomePage onSuccess={({registration, csrf}) => { setRegistration(registration); setCsrf(csrf); }}/>} />
                    <Route path="/register" element={<RegistrationRoute/>}/>
                </Routes>
            </AppLayout>
        </BrowserRouter>
    );
};

export default App;
