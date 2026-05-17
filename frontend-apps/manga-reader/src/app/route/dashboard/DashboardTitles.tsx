import { useState } from 'react';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiPlus } from 'react-icons/fi';

import AdminTitleList from '@feature/admin/component/AdminTitleList';
import ConfirmDeleteWithIdModal from '@feature/admin/component/modal/ConfirmDeleteWithIdModal';
import useAdminTitles from '@feature/admin/hook/useAdminTitles';
import { useAdminTitleActions } from '@/feature/admin';
import type { AdminTitle } from '@feature/admin/type/admin.types';

const DashboardTitles = () => {
    const { t } = useTranslation('admin');
    const {
        titles,
        page,
        totalPages,
        totalElements,
        isLoading,
        search,
        setSearch,
        setPage,
    } = useAdminTitles();
    const { isSubmitting, handleDelete } = useAdminTitleActions();

    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState(search);
    const [deletingTitle, setDeletingTitle] = useState<AdminTitle | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(0);
    };

    const confirmDelete = async () => {
        if (deletingTitle) {
            await handleDelete(deletingTitle.id);
            setDeletingTitle(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold">
                    {t('dashboard.titles.title')}
                </h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-tertiary">
                        {t('dashboard.titles.count', { count: totalElements })}
                    </span>
                    <button
                        onClick={() =>
                            navigate(`${WEB_BASE_URL}/dashboard/titles/new`)
                        }
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-dark"
                    >
                        <FiPlus size={14} />
                        {t('dashboard.titles.new')}
                    </button>
                </div>
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
                        placeholder={t('dashboard.titles.search')}
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

            <AdminTitleList
                titles={titles}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={title =>
                    navigate(
                        `${WEB_BASE_URL}/dashboard/titles/${title.id}/edit`,
                    )
                }
                onDelete={setDeletingTitle}
            />

            <ConfirmDeleteWithIdModal
                isOpen={deletingTitle !== null}
                onClose={() => setDeletingTitle(null)}
                onConfirm={confirmDelete}
                entityId={deletingTitle?.id ?? ''}
                title={t('dashboard.titles.deleteTitle')}
                message={t('dashboard.titles.deleteConfirm')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardTitles;
