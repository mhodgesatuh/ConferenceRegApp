// frontend/src/components/layout/AppLayout.tsx

import React from 'react';
import { useLocation } from 'react-router-dom';

import PageHeading from '@/components/ui/PageHeading';
import SubPageHeading from '@/components/ui/SubPageHeading';
import PageFooter from '@/components/ui/PageFooter';
import AdminTabs from '@/components/ui/AdminTabs';

type AppLayoutProps = {
    children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const location = useLocation();
    const isHome = location.pathname === '/home' || location.pathname === '/';
    const isAdmin = location.pathname === '/organizer';

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <PageHeading />
            <SubPageHeading showHomeLink={!isHome} />
            {isAdmin && <AdminTabs />}

            <main className="flex-1 w-full">
                <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
            </main>

            <PageFooter />
        </div>
    );
};

export default AppLayout;
