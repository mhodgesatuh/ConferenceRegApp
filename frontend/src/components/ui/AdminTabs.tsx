import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';

type AdminTabsProps = {
    activeTab: 'list' | 'update';
    onSelect: (tab: 'list' | 'update') => void;
    canViewList?: boolean;
};

const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, onSelect, canViewList = true }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleHome = () => navigate('/home');
    const handleForm = () => onSelect('update');
    const handleList = () => onSelect('list');

    const homeActive = location.pathname === '/home';

    return (
        <div className="w-full border-b bg-card">
            <div className="mx-auto w-[98vw] px-4 py-2 sm:px-6">
                <div className="admin-tabs" role="tablist" aria-label="Administration tabs">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={homeActive}
                        className={cn('admin-tab', homeActive && 'admin-tab--active')}
                        onClick={handleHome}
                    >
                        Home
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'update'}
                        aria-controls="tab-panel-update"
                        id="tab-update"
                        className={cn('admin-tab', activeTab === 'update' && 'admin-tab--active')}
                        onClick={handleForm}
                    >
                        Registration Form
                    </button>
                    {canViewList && (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'list'}
                            aria-controls="tab-panel-list"
                            id="tab-list"
                            className={cn('admin-tab', activeTab === 'list' && 'admin-tab--active')}
                            onClick={handleList}
                        >
                            Registrations Table
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminTabs;
