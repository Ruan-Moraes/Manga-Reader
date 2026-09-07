import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    AdminGroupList,
    AdminGroupDetailModal,
    GroupFormModal,
    ConfirmDeleteWithIdModal,
    useAdminGroups,
    useAdminGroupActions,
    type AdminGroup,
    type GroupFormSubmitPayload,
} from '@features/admin';
import ListPageHeader from './parts/ListPageHeader';

type ModalKind = 'detail' | 'edit' | 'delete' | null;

const DashboardGroups = () => {
    const { t } = useTranslation('admin');
    const { groups, page, totalPages, totalElements, isLoading, search, setSearch, setPage } = useAdminGroups();
    const { isSubmitting, handleUpdate, handleDelete } = useAdminGroupActions();

    const [searchInput, setSearchInput] = useState(search);
    const [selected, setSelected] = useState<AdminGroup | null>(null);
    const [modal, setModal] = useState<ModalKind>(null);

    const submitSearch = () => {
        setSearch(searchInput);
        setPage(0);
    };

    const openDetail = (group: AdminGroup) => {
        setSelected(group);
        setModal('detail');
    };

    const handleFormSubmit = async (data: GroupFormSubmitPayload) => {
        if (!selected) return;
        const result = await handleUpdate(selected.id, data);
        if (result) setModal('detail');
    };

    const confirmDelete = async () => {
        if (!selected) return;
        await handleDelete(selected.id);
        setModal(null);
        setSelected(null);
    };

    return (
        <div className="flex flex-col gap-4">
            <ListPageHeader
                title={t('dashboard.groups.title')}
                count={t('dashboard.groups.count', { count: totalElements })}
                searchValue={searchInput}
                onSearchChange={setSearchInput}
                onSubmitSearch={submitSearch}
                searchPlaceholder={t('dashboard.groups.search')}
                searchButtonLabel={t('common.search')}
            />

            <AdminGroupList
                groups={groups}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={openDetail}
                onRowClick={openDetail}
                onDelete={group => {
                    setSelected(group);
                    setModal('delete');
                }}
            />

            <AdminGroupDetailModal
                isOpen={modal === 'detail'}
                onClose={() => setModal(null)}
                groupId={selected?.id ?? null}
                onEdit={() => setModal('edit')}
                onDelete={() => setModal('delete')}
            />

            <GroupFormModal
                isOpen={modal === 'edit'}
                onClose={() => setModal('detail')}
                onSubmit={handleFormSubmit}
                group={selected}
                isSubmitting={isSubmitting}
            />

            <ConfirmDeleteWithIdModal
                isOpen={modal === 'delete'}
                onClose={() => setModal(selected ? 'detail' : null)}
                onConfirm={confirmDelete}
                entityId={selected?.id ?? ''}
                title={t('dashboard.groups.deleteTitle')}
                message={t('dashboard.groups.deleteConfirm')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardGroups;
