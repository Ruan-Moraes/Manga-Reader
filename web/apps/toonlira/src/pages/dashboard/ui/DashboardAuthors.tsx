import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    AdminAuthorList,
    AuthorFormModal,
    ConfirmDeleteWithIdModal,
    useAdminAuthors,
    useAdminAuthorActions,
    type AdminAuthor,
    type CreateAuthorRequest,
} from '@features/admin';
import ListPageHeader from './parts/ListPageHeader';

const DashboardAuthors = () => {
    const { t } = useTranslation('admin');
    const { authors, page, totalPages, totalElements, isLoading, search, setSearch, setPage } = useAdminAuthors();
    const { isSubmitting, handleCreate, handleUpdate, handleDelete } = useAdminAuthorActions();

    const [searchInput, setSearchInput] = useState(search);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<AdminAuthor | null>(null);
    const [deleting, setDeleting] = useState<AdminAuthor | null>(null);

    const submitSearch = () => {
        setSearch(searchInput);
        setPage(0);
    };

    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const openEdit = (author: AdminAuthor) => {
        setEditing(author);
        setFormOpen(true);
    };

    const handleFormSubmit = async (data: CreateAuthorRequest) => {
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
                title={t('dashboard.authors.title')}
                count={t('dashboard.authors.count', { count: totalElements })}
                onNew={openNew}
                newLabel={t('dashboard.authors.new')}
                searchValue={searchInput}
                onSearchChange={setSearchInput}
                onSubmitSearch={submitSearch}
                searchPlaceholder={t('dashboard.authors.search')}
                searchButtonLabel={t('common.search')}
            />

            <AdminAuthorList
                authors={authors}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={openEdit}
                onRowClick={openEdit}
                onDelete={setDeleting}
            />

            <AuthorFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                author={editing}
                isSubmitting={isSubmitting}
            />

            <ConfirmDeleteWithIdModal
                isOpen={deleting !== null}
                onClose={() => setDeleting(null)}
                onConfirm={confirmDelete}
                entityId={deleting?.id ?? ''}
                title={t('dashboard.authors.deleteTitle')}
                message={t('dashboard.authors.deleteConfirm')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardAuthors;
