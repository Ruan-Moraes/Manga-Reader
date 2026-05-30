import { Suspense, useCallback, useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';

import RouteSuspenseFallback from '@shared/component/loading/RouteSuspenseFallback';

import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    return (
        <>
            <ScrollRestoration />
            <div className="flex flex-col h-screen overflow-hidden">
                <AdminHeader onToggleSidebar={toggleSidebar} />
                <div className="flex flex-1 min-h-0">
                    <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
                    <div id="admin-content" className="relative flex flex-col flex-1 min-h-0 min-w-0">
                        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 md:p-6">
                            <div className="lg:max-w-6xl lg:mx-auto">
                                <Suspense fallback={<RouteSuspenseFallback />}>
                                    <Outlet />
                                </Suspense>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminLayout;
