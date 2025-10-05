import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthContext';
import TabsBar from './TabsBar';

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

    const items = [
        {
            id: 'admin-primary',
            label: loggingOut ? 'Logging out…' : homeLabel,
            onClick: handlePrimary,
            disabled: loggingOut,
            type: 'action' as const,
        },
        {
            id: 'tab-update',
            label: 'Registration Form',
            onClick: handleForm,
            active: activeTab === 'update',
            ariaControls: 'tab-panel-update',
        },
    ];

    if (canViewList) {
        items.push({
            id: 'tab-list',
            label: 'Registrations Table',
            onClick: handleList,
            active: activeTab === 'list',
            ariaControls: 'tab-panel-list',
        });
    }

    return <TabsBar items={items} ariaLabel="Administration tabs" />;
};

export default AdminTabs;
