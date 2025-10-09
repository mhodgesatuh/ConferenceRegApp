// frontend/src/components/layout/AppLayout.tsx

import React from 'react';
import { useLocation } from 'react-router-dom';

import PageHeader from '@/components/PageHeader';
import PageFooter from '@/components/PageFooter';

type AppLayoutProps = {
    children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const location = useLocation();
    const isAdmin = location.pathname === '/organizer';

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <PageHeader />

            <main className="w-full">
                {isAdmin ? (
                    children
                ) : (
                    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
                )}
            </main>

            <PageFooter />
        </div>
    );
};

export default AppLayout;
