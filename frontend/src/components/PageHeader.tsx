// frontend/src/components/PageHeader.tsx

import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { formatFullName } from '@/lib/formatName';

const PageHeader: React.FC = () => {
    const { registration } = useAuth();

    const fullName = formatFullName(
        registration?.firstName,
        registration?.lastName
    );

    const message = registration
        ? fullName ? `Welcome ${fullName}` : 'Welcome'
        : 'By Invitation';

    return (
        <div
            className="w-full bg-cover bg-center"
            style={{ backgroundImage: "url('/header-background.png')" }}
        >
            <div className="bg-black/50 text-center">
                <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Somewhere Good Conference Registration
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
