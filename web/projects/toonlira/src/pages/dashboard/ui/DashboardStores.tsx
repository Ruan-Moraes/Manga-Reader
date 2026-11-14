import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminStoreList, ConfirmDeleteWithIdModal, StoreFormModal, useAdminStoreActions, useAdminStores, type AdminStore, type StoreRequest } from '@features/admin';
import ListPageHeader from './parts/ListPageHeader';

const DashboardStores = () => {
    const { t } = useTranslation('admin'); const { stores, page, setPage, totalPages, totalElements, isLoading, search, setSearch } = useAdminStores(); const actions = useAdminStoreActions();
    const [searchInput, setSearchInput] = useState(search); const [editing, setEditing] = useState<AdminStore | null>(null); const [formOpen, setFormOpen] = useState(false); const [deleting, setDeleting] = useState<AdminStore | null>(null);
    const submit = async (data: StoreRequest) => { const result = editing ? await actions.handleUpdate(editing.id, data) : await actions.handleCreate(data); if (result) setFormOpen(false); };
    return <div className="flex flex-col gap-4"><ListPageHeader title={t('stores.title')} count={t('stores.count', { count: totalElements })} onNew={() => { setEditing(null); setFormOpen(true); }} newLabel={t('stores.new')} searchValue={searchInput} onSearchChange={setSearchInput} onSubmitSearch={() => { setSearch(searchInput); setPage(0); }} searchPlaceholder={t('stores.search')} searchButtonLabel={t('common.search')} /><AdminStoreList stores={stores} page={page} totalPages={totalPages} isLoading={isLoading} onPageChange={setPage} onEdit={store => { setEditing(store); setFormOpen(true); }} onDelete={setDeleting} /><StoreFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} store={editing} isSubmitting={actions.isSubmitting} onSubmit={submit} /><ConfirmDeleteWithIdModal isOpen={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={async () => { if (deleting) { await actions.handleDelete(deleting.id); setDeleting(null); } }} entityId={deleting?.id ?? ''} title={t('stores.deleteTitle')} message={t('stores.deleteConfirm')} isSubmitting={actions.isSubmitting} /></div>;
};
export default DashboardStores;
