import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { AdminTitleList, TitleFormModal, ConfirmDeleteWithIdModal, useAdminTitles, useAdminTitleActions, type AdminTitle } from '@features/admin';
import ListPageHeader from './parts/ListPageHeader';

const DashboardTitles = () => {
    const { t } = useTranslation('admin');
    const appNavigate = useAppNavigate();
    const { titles, page, totalPages, totalElements, isLoading, search, setSearch, setPage } = useAdminTitles();
    const { isSubmitting, handleDelete } = useAdminTitleActions();

    const [searchInput, setSearchInput] = useState(search);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<AdminTitle | null>(null);
    const [deletingTitle, setDeletingTitle] = useState<AdminTitle | null>(null);

    const submitSearch = () => {
        setSearch(searchInput);
        setPage(0);
    };

    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const openEdit = (title: AdminTitle) => {
        setEditing(title);
        setFormOpen(true);
    };

    const confirmDelete = async () => {
        if (deletingTitle) {
            await handleDelete(deletingTitle.id);
            setDeletingTitle(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <ListPageHeader
                title={t('dashboard.titles.title')}
                count={t('dashboard.titles.count', { count: totalElements })}
                onNew={openNew}
                newLabel={t('dashboard.titles.new')}
                searchValue={searchInput}
                onSearchChange={setSearchInput}
                onSubmitSearch={submitSearch}
                searchPlaceholder={t('dashboard.titles.search')}
                searchButtonLabel={t('common.search')}
            />

            <AdminTitleList
                titles={titles}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={openEdit}
                onRowClick={openEdit}
                onDelete={setDeletingTitle}
                onManageChapters={title => appNavigate(ROUTES.DASHBOARD_CHAPTERS_BY_TITLE(title.id))}
            />

            <TitleFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                titleId={editing?.id ?? null}
                onSaved={() => setFormOpen(false)}
                onDelete={() => {
                    setDeletingTitle(editing);
                    setFormOpen(false);
                }}
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
