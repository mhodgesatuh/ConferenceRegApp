import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';

const PageHeader: React.FC = () => {
    const { registration } = useAuth();
    const firstName = typeof registration?.firstName === 'string' ? registration.firstName.trim() : '';
    const lastName = typeof registration?.lastName === 'string' ? registration.lastName.trim() : '';
    const hasName = firstName !== '' || lastName !== '';
    const message = registration
        ? hasName
            ? `Welcome ${[firstName, lastName].filter(Boolean).join(' ')}`
            : 'Welcome'
        : 'Invitation-only access';

    return (
        <div
            className="w-full bg-cover bg-center"
            style={{ backgroundImage: "url('/header-background.png')" }}
        >
            <div className="bg-black/50">
                <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Conference Registration
                    </h1>
                    <p className="mt-2 text-sm font-medium text-white/90 sm:text-base">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
