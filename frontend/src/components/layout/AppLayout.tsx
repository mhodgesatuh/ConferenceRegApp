// frontend/src/components/layout/AppLayout.tsx

import React from 'react';
import { Link } from 'react-router-dom';

type AppLayoutProps = {
    children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const year = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="border-b bg-card">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-8">
                    <Link to="/home" className="text-lg font-semibold tracking-tight text-foreground">
                        Conference Registration
                    </Link>
                    <span className="hidden text-sm text-muted-foreground sm:block">
                        Invitation-only access
                    </span>
                </div>
            </header>

            <main className="flex-1 w-full">
                <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
                    {children}
                </div>
            </main>

            <footer className="border-t bg-muted/40">
                <div className="mx-auto w-full max-w-5xl px-4 py-4 text-xs text-muted-foreground sm:px-8 sm:text-sm">
                    © {year} Conference Organizers. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default AppLayout;
