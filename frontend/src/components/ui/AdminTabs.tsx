import React from 'react';
import { useSearchParams } from 'react-router-dom';

const AdminTabs: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'update' ? 'update' : 'list';

    const handleSelect = (tab: 'list' | 'update') => {
        if (activeTab === tab) return;
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next, { replace: true });
    };

    return (
        <div className="w-full border-b bg-card">
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
                <div className="admin-tabs" role="tablist" aria-label="Administration tabs">
                    <button
                        role="tab"
                        aria-selected={activeTab === 'list'}
                        aria-controls="tab-panel-list"
                        id="tab-list"
                        className={`admin-tab ${activeTab === 'list' ? 'admin-tab--active' : ''}`}
                        onClick={() => handleSelect('list')}
                        type="button"
                    >
                        List Registrations
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'update'}
                        aria-controls="tab-panel-update"
                        id="tab-update"
                        className={`admin-tab ${activeTab === 'update' ? 'admin-tab--active' : ''}`}
                        onClick={() => handleSelect('update')}
                        type="button"
                    >
                        Update Registration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminTabs;
