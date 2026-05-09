import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiPlus } from 'react-icons/fi';

import AdminNewsList from '@feature/admin/component/AdminNewsList';
import ConfirmDeleteWithIdModal from '@feature/admin/component/modal/ConfirmDeleteWithIdModal';
import useAdminNews from '@feature/admin/hook/useAdminNews';
import { useAdminNewsActions } from '@/feature/admin';
import type { AdminNews } from '@feature/admin/type/admin.types';

const DashboardNews = () => {
    const { t } = useTranslation('admin');
    const {
        news,
        page,
        totalPages,
        totalElements,
        isLoading,
        search,
        setSearch,
        setPage,
    } = useAdminNews();
    const { isSubmitting, handleDelete } = useAdminNewsActions();

    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState(search);
    const [deletingNews, setDeletingNews] = useState<AdminNews | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(0);
    };

    const confirmDelete = async () => {
        if (deletingNews) {
            await handleDelete(deletingNews.id);
            setDeletingNews(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold">
                    {t('dashboard.news.title')}
                </h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-tertiary">
                        {t('dashboard.news.count', { count: totalElements })}
                    </span>
                    <button
                        onClick={() =>
                            navigate('/Manga-Reader/dashboard/news/new')
                        }
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-dark"
                    >
                        <FiPlus size={14} />
                        {t('dashboard.news.new')}
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
                        placeholder={t('dashboard.news.search')}
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

            <AdminNewsList
                news={news}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={n =>
                    navigate(`/Manga-Reader/dashboard/news/${n.id}/edit`)
                }
                onDelete={setDeletingNews}
            />

            <ConfirmDeleteWithIdModal
                isOpen={deletingNews !== null}
                onClose={() => setDeletingNews(null)}
                onConfirm={confirmDelete}
                entityId={deletingNews?.id ?? ''}
                title={t('dashboard.news.deleteTitle')}
                message={t('dashboard.news.deleteConfirm')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardNews;
