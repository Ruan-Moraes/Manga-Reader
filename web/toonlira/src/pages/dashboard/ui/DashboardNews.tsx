import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    AdminNewsList,
    NewsFormModal,
    ConfirmDeleteWithIdModal,
    useAdminNews,
    useAdminNewsActions,
    type AdminNews,
    type CreateNewsRequest,
    type UpdateNewsRequest,
} from '@features/admin';
import ListPageHeader from './parts/ListPageHeader';
import { Select } from '@ui/Select';
import { LABEL_TYPES, useDomainLabels } from '@entities/label';
import type { NewsStatus } from '@entities/news';

const DashboardNews = () => {
    const { t } = useTranslation('admin');
    const { news, page, totalPages, totalElements, isLoading, search, setSearch, setPage, status, setStatus, category, setCategory } = useAdminNews();
    const { data: categories = [] } = useDomainLabels(LABEL_TYPES.NEWS_CATEGORY);
    const { isSubmitting, handleCreate, handleUpdate, handleDelete, handlePublish, handleUnpublish, handleDraft, handleSchedule } = useAdminNewsActions();

    const [searchInput, setSearchInput] = useState(search);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<AdminNews | null>(null);
    const [deletingNews, setDeletingNews] = useState<AdminNews | null>(null);

    const submitSearch = () => {
        setSearch(searchInput);
        setPage(0);
    };

    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const openEdit = (item: AdminNews) => {
        setEditing(item);
        setFormOpen(true);
    };

    const handleFormSubmit = async (data: CreateNewsRequest | UpdateNewsRequest) => {
        const result = editing ? await handleUpdate(editing.id, data) : await handleCreate(data as CreateNewsRequest);
        if (result) setFormOpen(false);
    };

    const confirmDelete = async () => {
        if (deletingNews) {
            await handleDelete(deletingNews.id);
            setDeletingNews(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <ListPageHeader
                title={t('dashboard.news.title')}
                count={t('dashboard.news.count', { count: totalElements })}
                onNew={openNew}
                newLabel={t('dashboard.news.new')}
                searchValue={searchInput}
                onSearchChange={setSearchInput}
                onSubmitSearch={submitSearch}
                searchPlaceholder={t('dashboard.news.search')}
                searchButtonLabel={t('common.search')}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
                <Select aria-label={t('dashboard.news.statusFilter')} value={status} onChange={event => { setStatus(event.target.value as NewsStatus | ''); setPage(0); }} options={[{ value: '', label: t('dashboard.news.allStatuses') }, ...(['DRAFT','SCHEDULED','PUBLISHED','UNPUBLISHED'] as const).map(value => ({ value, label: t(`newsForm.status.${value}`) }))]} />
                <Select aria-label={t('dashboard.news.categoryFilter')} value={category} onChange={event => { setCategory(event.target.value); setPage(0); }} options={[{ value: '', label: t('dashboard.news.allCategories') }, ...categories]} />
            </div>

            <AdminNewsList
                news={news}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={openEdit}
                onRowClick={openEdit}
                onDelete={setDeletingNews}
            />

            <NewsFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                news={editing}
                isSubmitting={isSubmitting}
                onDelete={() => {
                    setDeletingNews(editing);
                    setFormOpen(false);
                }}
                onPublish={() => editing && handlePublish(editing.id)}
                onUnpublish={() => editing && handleUnpublish(editing.id)}
                onDraft={() => editing && handleDraft(editing.id)}
                onSchedule={scheduledAt => editing && handleSchedule(editing.id, scheduledAt)}
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
