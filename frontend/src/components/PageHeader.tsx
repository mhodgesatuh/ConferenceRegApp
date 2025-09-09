import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
    title: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title }) => (
    <header className="pb-2 mb-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <Link to="/home" className="flex items-center gap-1 text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Home
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold text-center w-full">
                {title}
            </h1>
        </div>
    </header>
);

export default PageHeader;
