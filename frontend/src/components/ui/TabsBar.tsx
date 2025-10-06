// frontend/src/components/ui/TabsBar.tsx

import React from 'react';

import { cn } from '@/lib/utils';

type TabsBarItemBase = {
    id: string;
    label: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    ariaControls?: string;
};

type TabsBarActionItem = TabsBarItemBase & {
    type: 'action';
};

type TabsBarTabItem = TabsBarItemBase & {
    type?: 'tab';
    active?: boolean;
};

type TabsBarItem = TabsBarActionItem | TabsBarTabItem;

type TabsBarProps = {
    items: TabsBarItem[];
    ariaLabel?: string;
    sticky?: boolean;
    className?: string;
    innerClassName?: string;
};

const TabsBar: React.FC<TabsBarProps> = ({
    items,
    ariaLabel = 'Tabs',
    sticky = false,
    className,
    innerClassName,
}) => {
    const containerClasses = cn('w-full bg-card', sticky && 'sticky top-0 z-40', className);
    const innerClasses = cn('mx-auto w-full px-4 py-2 sm:px-6', innerClassName);

    return (
        <div className={containerClasses}>
            <div className={innerClasses}>
                <div className="admin-tabs" role="tablist" aria-label={ariaLabel}>
                    {items.map((item) => {
                        const isTab = item.type !== 'action';
                        const isActive = isTab && (item as TabsBarTabItem).active;
                        const baseClass = cn('admin-tab', isActive && 'admin-tab--active', item.className);

                        return (
                            <button
                                key={item.id}
                                type="button"
                                role={isTab ? 'tab' : 'button'}
                                id={isTab ? item.id : undefined}
                                aria-selected={isTab ? Boolean(isActive) : undefined}
                                aria-controls={isTab ? item.ariaControls : undefined}
                                className={baseClass}
                                onClick={item.onClick}
                                disabled={item.disabled}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TabsBar;
