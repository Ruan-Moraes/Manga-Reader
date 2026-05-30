import { useState } from 'react';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { ROUTES } from '@shared/constant/ROUTES';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { AdminUserList, ConfirmDeleteWithIdModal, useAdminUsers, useAdminUserActions, type AdminUser } from '@features/admin';

const DashboardUsers = () => {
    const { t } = useTranslation('admin');
    const { users, page, totalPages, totalElements, isLoading, search, setSearch, setPage } = useAdminUsers();
    const { isSubmitting, handleDelete } = useAdminUserActions();

    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState(search);
    const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(0);
    };

    const confirmDelete = async () => {
        if (deletingUser) {
            await handleDelete(deletingUser.id);
            setDeletingUser(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold">{t('dashboard.users.title')}</h1>
                <span className="text-sm text-tertiary">{t('dashboard.users.count', { count: totalElements })}</span>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute text-tertiary left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder={t('dashboard.users.search')}
                        className="w-full py-2 pl-9 pr-3 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </div>
                <button type="submit" className="px-4 py-2 text-sm font-semibold border rounded-xs border-tertiary hover:bg-tertiary/30">
                    {t('common.search')}
                </button>
            </form>

            <AdminUserList
                users={users}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={user => navigate(`${WEB_BASE_URL}${ROUTES.DASHBOARD_USERS}/${user.id}`)}
                onDelete={setDeletingUser}
            />

            <ConfirmDeleteWithIdModal
                isOpen={deletingUser !== null}
                onClose={() => setDeletingUser(null)}
                onConfirm={confirmDelete}
                entityId={deletingUser?.id ?? ''}
                title={t('dashboard.users.deleteTitle')}
                message={t('dashboard.users.deleteConfirm')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardUsers;
