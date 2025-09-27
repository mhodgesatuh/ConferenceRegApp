import React from 'react';

const PageHeading: React.FC = () => {
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
                        Invitation-only access
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PageHeading;
