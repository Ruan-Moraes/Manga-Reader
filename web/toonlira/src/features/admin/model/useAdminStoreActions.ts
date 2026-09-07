import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { createStore, deleteStore, updateStore } from '../api/adminStoreService';
import type { StoreRequest } from './admin.types';

const useAdminStoreActions = () => {
    const client = useQueryClient(); const [isSubmitting, setIsSubmitting] = useState(false);
    const run = async <T,>(action: () => Promise<T>) => { setIsSubmitting(true); try { const result = await action(); await client.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_STORES] }); return result; } finally { setIsSubmitting(false); } };
    return { isSubmitting, handleCreate: (data: StoreRequest) => run(() => createStore(data)), handleUpdate: (id: string, data: StoreRequest) => run(() => updateStore(id, data)), handleDelete: (id: string) => run(() => deleteStore(id)) };
};
export default useAdminStoreActions;
