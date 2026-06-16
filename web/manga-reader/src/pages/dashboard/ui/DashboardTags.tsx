import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminTagList, TagFormModal, ConfirmDeleteWithIdModal, useAdminTags, useAdminTagActions, type AdminTag } from '@features/admin';
import ListPageHeader from './parts/ListPageHeader';

const DashboardTags = () => {
    const { t } = useTranslation('admin');
    const { tags, page, totalPages, totalElements, isLoading, search, setSearch, setPage } = useAdminTags();
    const { isSubmitting, handleCreate, handleUpdate, handleDelete } = useAdminTagActions();

    const [editingTag, setEditingTag] = useState<AdminTag | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deletingTag, setDeletingTag] = useState<AdminTag | null>(null);

    const openCreateForm = () => {
        setEditingTag(null);
        setIsFormOpen(true);
    };

    const openEditForm = (tag: AdminTag) => {
        setEditingTag(tag);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (label: import('@shared/type/i18n').LocalizedString) => {
        if (editingTag) {
            await handleUpdate(editingTag.value, { label });
        } else {
            await handleCreate({ label });
        }
        setIsFormOpen(false);
        setEditingTag(null);
    };

    const confirmDelete = async () => {
        if (deletingTag) {
            await handleDelete(deletingTag.value);
            setDeletingTag(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <ListPageHeader
                title={t('dashboard.tags.title')}
                count={t('dashboard.tags.count', { count: totalElements })}
                onNew={openCreateForm}
                newLabel={t('dashboard.tags.new')}
                searchValue={search}
                onSearchChange={value => {
                    setSearch(value);
                    setPage(0);
                }}
                onSubmitSearch={() => setPage(0)}
                searchPlaceholder={t('dashboard.tags.search')}
                searchButtonLabel={t('common.search')}
            />

            <AdminTagList
                tags={tags}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={openEditForm}
                onDelete={setDeletingTag}
            />

            <TagFormModal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingTag(null);
                }}
                onSubmit={handleFormSubmit}
                tag={editingTag}
                isSubmitting={isSubmitting}
            />

            <ConfirmDeleteWithIdModal
                isOpen={deletingTag !== null}
                onClose={() => setDeletingTag(null)}
                onConfirm={confirmDelete}
                entityId={deletingTag ? String(deletingTag.value) : ''}
                title={t('dashboard.tags.deleteTitle')}
                message={t('dashboard.tags.deleteConfirm', {
                    label: deletingTag?.label ?? '',
                })}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardTags;
