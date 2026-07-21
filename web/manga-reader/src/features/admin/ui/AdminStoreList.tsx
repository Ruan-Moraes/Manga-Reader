import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '@ui/DataTable';
import RowActions from './parts/RowActions';
import type { AdminStore } from '../model/admin.types';

type Props = { stores: AdminStore[]; page: number; totalPages: number; isLoading: boolean; onPageChange: (page: number) => void; onEdit: (store: AdminStore) => void; onDelete: (store: AdminStore) => void };
const AdminStoreList = ({ stores, page, totalPages, isLoading, onPageChange, onEdit, onDelete }: Props) => {
    const { t, i18n } = useTranslation('admin');
    const columns: Column<AdminStore>[] = [
        { key: 'name', header: t('stores.name'), render: store => <span className="font-mr-bold text-mr-fg">{store.name[i18n.language as keyof typeof store.name] ?? store.name['pt-BR'] ?? Object.values(store.name)[0]}</span> },
        { key: 'website', header: t('stores.website'), hideBelow: 'md', render: store => <span className="max-w-48 truncate text-mr-fg-subtle">{store.website}</span> },
        { key: 'status', header: t('stores.status'), render: store => <span className={store.status === 'ACTIVE' ? 'text-mr-success' : 'text-mr-fg-subtle'}>{store.status === 'ACTIVE' ? t('stores.active') : t('stores.inactive')}</span> },
        { key: 'displayOrder', header: t('stores.order'), hideBelow: 'sm', render: store => <span>{store.displayOrder}</span> },
        { key: 'actions', header: t('stores.actions'), align: 'right', render: store => <RowActions onEdit={() => onEdit(store)} onDelete={() => onDelete(store)} editLabel={t('common.edit')} deleteLabel={t('common.delete')} /> },
    ];
    return <DataTable columns={columns} data={stores} keyExtractor={store => store.id} page={page} totalPages={totalPages} onPageChange={onPageChange} isLoading={isLoading} emptyMessage={t('stores.empty')} />;
};
export default AdminStoreList;
