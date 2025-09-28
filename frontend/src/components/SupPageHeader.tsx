import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type SupPageHeaderProps = {
    showHomeLink?: boolean;
};

const SupPageHeader: React.FC<SupPageHeaderProps> = ({ showHomeLink = false }) => {
    return (
        <div className="w-full border-b bg-muted/40">
            <div className="mx-auto flex w-full max-w-5xl items-center px-4 py-2 sm:px-8">
                {showHomeLink && (
                    <Link to="/home" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        <span>Home</span>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default SupPageHeader;
