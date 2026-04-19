import { useState } from 'react';

import AdminTagList from '@feature/admin/component/AdminTagList';
import TagFormModal from '@feature/admin/component/modal/TagFormModal';
import ConfirmDeleteModal from '@shared/component/modal/ConfirmDeleteModal';
import useAdminTags from '@feature/admin/hook/useAdminTags';
import { useAdminTagActions } from '@/feature/admin';
import type { AdminTag } from '@feature/admin/type/admin.types';

const DashboardTags = () => {
    const {
        tags,
        page,
        totalPages,
        totalElements,
        isLoading,
        search,
        setSearch,
        setPage,
    } = useAdminTags();

    const { isSubmitting, handleCreate, handleUpdate, handleDelete } =
        useAdminTagActions();

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

    const handleFormSubmit = async (label: string) => {
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
            <h1 className="text-lg font-bold">Tags</h1>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                        placeholder="Buscar tags..."
                        className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                    <span className="text-sm text-tertiary">
                        {totalElements} tags
                    </span>
                </div>
                <button
                    type="button"
                    onClick={openCreateForm}
                    className="px-3 py-2 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80"
                >
                    Nova Tag
                </button>
            </div>

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

            <ConfirmDeleteModal
                isOpen={deletingTag !== null}
                onClose={() => setDeletingTag(null)}
                onConfirm={confirmDelete}
                title="Excluir Tag"
                message={`Tem certeza que deseja excluir a tag "${deletingTag?.label}"?`}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardTags;
