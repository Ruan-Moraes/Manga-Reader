import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    AdminUserList,
    AdminUserDetailModal,
    ChangeRoleModal,
    BanUserModal,
    ConfirmModal,
    ConfirmDeleteWithIdModal,
    useAdminUsers,
    useAdminUserActions,
    type AdminUser,
} from '@features/admin';
import ListPageHeader from './parts/ListPageHeader';

type ModalKind = 'detail' | 'role' | 'ban' | 'unban' | 'delete' | null;

const DashboardUsers = () => {
    const { t } = useTranslation('admin');
    const { users, page, totalPages, totalElements, isLoading, search, setSearch, setPage } = useAdminUsers();
    const { isSubmitting, handleChangeRole, handleBan, handleUnban, handleDelete } = useAdminUserActions();

    const [searchInput, setSearchInput] = useState(search);
    const [selected, setSelected] = useState<AdminUser | null>(null);
    const [modal, setModal] = useState<ModalKind>(null);

    const submitSearch = () => {
        setSearch(searchInput);
        setPage(0);
    };

    const open = (user: AdminUser, kind: Exclude<ModalKind, null>) => {
        setSelected(user);
        setModal(kind);
    };
    const close = () => setModal(null);

    const confirmRole = async (role: string) => {
        if (!selected) return;
        await handleChangeRole(selected.id, role);
        close();
    };

    const confirmBan = async (reason: string, bannedUntil: string | null) => {
        if (!selected) return;
        await handleBan(selected.id, { reason, bannedUntil });
        close();
    };

    const confirmUnban = async () => {
        if (!selected) return;
        await handleUnban(selected.id);
        close();
    };

    const confirmDelete = async () => {
        if (!selected) return;
        await handleDelete(selected.id);
        close();
    };

    return (
        <div className="flex flex-col gap-4">
            <ListPageHeader
                title={t('dashboard.users.title')}
                count={t('dashboard.users.count', { count: totalElements })}
                searchValue={searchInput}
                onSearchChange={setSearchInput}
                onSubmitSearch={submitSearch}
                searchPlaceholder={t('dashboard.users.search')}
                searchButtonLabel={t('common.search')}
            />

            <AdminUserList
                users={users}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={user => open(user, 'detail')}
                onRowClick={user => open(user, 'detail')}
                onDelete={user => open(user, 'delete')}
            />

            <AdminUserDetailModal
                isOpen={modal === 'detail'}
                onClose={close}
                user={selected}
                onChangeRole={() => setModal('role')}
                onBan={() => setModal('ban')}
                onUnban={() => setModal('unban')}
            />

            <ChangeRoleModal
                isOpen={modal === 'role'}
                onClose={close}
                onConfirm={confirmRole}
                userName={selected?.name ?? ''}
                currentRole={selected?.role ?? 'MEMBER'}
                isSubmitting={isSubmitting}
            />

            <BanUserModal isOpen={modal === 'ban'} onClose={close} onConfirm={confirmBan} userName={selected?.name ?? ''} isSubmitting={isSubmitting} />

            <ConfirmModal
                isOpen={modal === 'unban'}
                onClose={close}
                onConfirm={confirmUnban}
                title={t('userDetail.unbanTitle')}
                message={t('userDetail.unbanMessage', { name: selected?.name ?? '' })}
                confirmLabel={t('userDetail.unban')}
                isSubmitting={isSubmitting}
            />

            <ConfirmDeleteWithIdModal
                isOpen={modal === 'delete'}
                onClose={close}
                onConfirm={confirmDelete}
                entityId={selected?.id ?? ''}
                title={t('dashboard.users.deleteTitle')}
                message={t('dashboard.users.deleteConfirm')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardUsers;
