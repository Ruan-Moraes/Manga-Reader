import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    AdminPublisherList,
    PublisherFormModal,
    ConfirmDeleteWithIdModal,
    useAdminPublishers,
    useAdminPublisherActions,
    type AdminPublisher,
    type CreatePublisherRequest,
} from '@features/admin';
import ListPageHeader from './parts/ListPageHeader';

const DashboardPublishers = () => {
    const { t } = useTranslation('admin');
    const { publishers, page, totalPages, totalElements, isLoading, search, setSearch, setPage } = useAdminPublishers();
    const { isSubmitting, handleCreate, handleUpdate, handleDelete } = useAdminPublisherActions();

    const [searchInput, setSearchInput] = useState(search);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<AdminPublisher | null>(null);
    const [deleting, setDeleting] = useState<AdminPublisher | null>(null);

    const submitSearch = () => {
        setSearch(searchInput);
        setPage(0);
    };

    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const openEdit = (publisher: AdminPublisher) => {
        setEditing(publisher);
        setFormOpen(true);
    };

    const handleFormSubmit = async (data: CreatePublisherRequest) => {
        const result = editing ? await handleUpdate(editing.id, data) : await handleCreate(data);
        if (result) setFormOpen(false);
    };

    const confirmDelete = async () => {
        if (deleting) {
            await handleDelete(deleting.id);
            setDeleting(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <ListPageHeader
                title={t('dashboard.publishers.title')}
                count={t('dashboard.publishers.count', { count: totalElements })}
                onNew={openNew}
                newLabel={t('dashboard.publishers.new')}
                searchValue={searchInput}
                onSearchChange={setSearchInput}
                onSubmitSearch={submitSearch}
                searchPlaceholder={t('dashboard.publishers.search')}
                searchButtonLabel={t('common.search')}
            />

            <AdminPublisherList
                publishers={publishers}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={openEdit}
                onRowClick={openEdit}
                onDelete={setDeleting}
            />

            <PublisherFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                publisher={editing}
                isSubmitting={isSubmitting}
            />

            <ConfirmDeleteWithIdModal
                isOpen={deleting !== null}
                onClose={() => setDeleting(null)}
                onConfirm={confirmDelete}
                entityId={deleting?.id ?? ''}
                title={t('dashboard.publishers.deleteTitle')}
                message={t('dashboard.publishers.deleteConfirm')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardPublishers;
