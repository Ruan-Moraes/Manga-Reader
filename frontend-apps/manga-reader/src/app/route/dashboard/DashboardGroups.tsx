import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiSearch } from 'react-icons/fi';

import AdminGroupList from '@feature/admin/component/AdminGroupList';
import ConfirmDeleteWithIdModal from '@feature/admin/component/modal/ConfirmDeleteWithIdModal';
import useAdminGroups from '@feature/admin/hook/useAdminGroups';
import { useAdminGroupActions } from '@/feature/admin';
import type { AdminGroup } from '@feature/admin/type/admin.types';

const DashboardGroups = () => {
    const { t } = useTranslation('admin');
    const {
        groups,
        page,
        totalPages,
        totalElements,
        isLoading,
        search,
        setSearch,
        setPage,
    } = useAdminGroups();
    const { isSubmitting, handleDelete } = useAdminGroupActions();

    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState(search);
    const [deletingGroup, setDeletingGroup] = useState<AdminGroup | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(0);
    };

    const confirmDelete = async () => {
        if (deletingGroup) {
            await handleDelete(deletingGroup.id);
            setDeletingGroup(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold">
                    {t('dashboard.groups.title')}
                </h1>
                <span className="text-sm text-tertiary">
                    {t('dashboard.groups.count', { count: totalElements })}
                </span>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <FiSearch
                        size={16}
                        className="absolute text-tertiary left-3 top-1/2 -translate-y-1/2"
                    />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder={t('dashboard.groups.search')}
                        className="w-full py-2 pl-9 pr-3 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold border rounded-xs border-tertiary hover:bg-tertiary/30"
                >
                    {t('common.search')}
                </button>
            </form>

            <AdminGroupList
                groups={groups}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={group =>
                    navigate(`/Manga-Reader/dashboard/groups/${group.id}`)
                }
                onDelete={setDeletingGroup}
            />

            <ConfirmDeleteWithIdModal
                isOpen={deletingGroup !== null}
                onClose={() => setDeletingGroup(null)}
                onConfirm={confirmDelete}
                entityId={deletingGroup?.id ?? ''}
                title={t('dashboard.groups.deleteTitle')}
                message={t('dashboard.groups.deleteConfirm')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardGroups;
