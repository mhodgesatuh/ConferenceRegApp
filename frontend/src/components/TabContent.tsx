import React from 'react';

import { cn } from '@/lib/utils';

type TabContentProps = {
    children: React.ReactNode;
    className?: string;
};

const TabContent: React.FC<TabContentProps> = ({ children, className }) => {
    return (
        <div className="w-full bg-muted/40 py-1">
            <div className="mx-auto w-[94vw]">
                <div className={cn('tab-content-card', className)}>{children}</div>
            </div>
        </div>
    );
};

export default TabContent;
