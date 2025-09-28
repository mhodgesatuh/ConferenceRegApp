import React from "react";

interface PageTitleProps {
    title: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title }) => (
    <header className="pb-2 mb-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">{title}</h1>
    </header>
);

export default PageTitle;
