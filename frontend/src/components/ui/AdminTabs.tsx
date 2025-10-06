// frontend/src/components/ui/AdminTabs.tsx

import React, {useCallback, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {LogOut} from 'lucide-react';

import {useAuth} from '@/features/auth/AuthContext';
import TabsBar from './TabsBar';

type AdminTabsProps = {
    activeTab: 'list' | 'update' | 'presenters' | 'rsvp';
    onSelect: (tab: 'list' | 'update' | 'presenters' | 'rsvp') => void;
    isAdmin?: boolean;
};

const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, onSelect, isAdmin = true }) => {
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
    const handlePresenters = () => onSelect('presenters');
    const handleRsvp = () => onSelect('rsvp');

    const isLoggedIn = Boolean(registration);
    const homeLabel = isLoggedIn ? 'Logout' : 'Home';
    const handlePrimary = isLoggedIn ? handleLogout : handleHome;

    const primaryText = loggingOut ? 'Logging out…' : homeLabel;
    const primaryLabel = isLoggedIn ? (
        <span className="flex items-center gap-2">
            <LogOut className="h-4 w-4" aria-hidden="true"/>
            <span>{primaryText}</span>
        </span>
    ) : (
        primaryText
    );

    const items: React.ComponentProps<typeof TabsBar>['items'] = [
        {
            id: 'tab-update',
            label: 'Registration Form',
            onClick: handleForm,
            active: activeTab === 'update',
            ariaControls: 'tab-panel-update',
        },
    ];

    if (isAdmin) {
        items.push({
            id: 'tab-list',
            label: 'Registrations Table',
            onClick: handleList,
            active: activeTab === 'list',
            ariaControls: 'tab-panel-list',
        });
        items.push({
            id: 'tab-presenters',
            label: 'Presenters',
            onClick: handlePresenters,
            active: activeTab === 'presenters',
            ariaControls: 'tab-panel-presenters',
        });
        items.push({
            id: 'tab-rsvp',
            label: 'RSVP',
            onClick: handleRsvp,
            active: activeTab === 'rsvp',
            ariaControls: 'tab-panel-rsvp',
        });
    }

    items.push({
        id: 'admin-primary',
        label: primaryLabel,
        onClick: handlePrimary,
        disabled: loggingOut,
        type: 'action' as const,
        className: 'ml-auto',
    });

    return <TabsBar items={items} ariaLabel="Administration tabs"/>;
};

export default AdminTabs;
