import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthContext';

type AdminTabsProps = {
    activeTab: 'list' | 'update';
    onSelect: (tab: 'list' | 'update') => void;
    canViewList?: boolean;
};

const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, onSelect, canViewList = true }) => {
    const navigate = useNavigate();
    const { registration, logout } = useAuth();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = useCallback(async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await logout();
        } catch {
            // Ignore errors; we'll always navigate home.
        } finally {
            setLoggingOut(false);
            navigate('/home', { replace: true });
        }
    }, [loggingOut, logout, navigate]);

    const handleHome = useCallback(() => navigate('/home'), [navigate]);
    const handleForm = () => onSelect('update');
    const handleList = () => onSelect('list');

    const isLoggedIn = Boolean(registration);
    const homeLabel = isLoggedIn ? 'Logout' : 'Home';
    const handlePrimary = isLoggedIn ? handleLogout : handleHome;

    return (
        <div className="w-full border-b bg-card">
            <div className="mx-auto w-[98vw] px-4 py-2 sm:px-6">
                <div className="admin-tabs" role="tablist" aria-label="Administration tabs">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={false}
                        className={cn('admin-tab')}
                        onClick={handlePrimary}
                        disabled={loggingOut}
                    >
                        {loggingOut ? 'Logging out…' : homeLabel}
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
