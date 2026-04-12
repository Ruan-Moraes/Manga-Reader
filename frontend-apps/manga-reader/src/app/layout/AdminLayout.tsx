import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen">
            <AdminHeader
                onToggleSidebar={() => setSidebarOpen(prev => !prev)}
            />
            <div className="flex flex-1">
                <AdminSidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
                <main className="flex-1 p-4 overflow-auto md:p-6 lg:max-w-6xl lg:mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
