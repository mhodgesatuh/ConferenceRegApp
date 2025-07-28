// frontend/src/components/layout/AppLayout.tsx

import React from 'react';

type AppLayoutProps = {
    children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
    return (
        <div className="min-h-screen bg-background text-foreground px-4 py-6 sm:px-8 sm:py-10 max-w-3xl mx-auto">
            {children}
        </div>
    );
};

export default AppLayout;
