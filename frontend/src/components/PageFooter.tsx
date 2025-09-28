import React from 'react';

const PageFooter: React.FC = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="w-full border-t bg-muted/40">
            <div className="mx-auto w-full max-w-5xl px-4 py-4 text-xs text-muted-foreground sm:px-8 sm:text-sm">
                © {year} Conference Organizers. All rights reserved.
            </div>
        </footer>
    );
};

export default PageFooter;
