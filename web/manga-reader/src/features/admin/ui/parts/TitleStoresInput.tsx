import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@ui/Button';
import { Input } from '@ui/Input';
import { Select } from '@ui/Select';
import type { AdminStore, TitleStoreRef } from '../../model/admin.types';

type Props = { value: TitleStoreRef[]; stores: AdminStore[]; onChange: (value: TitleStoreRef[]) => void };
const TitleStoresInput = ({ value, stores, onChange }: Props) => {
    const { t, i18n } = useTranslation('admin');
    const available = stores.filter(store => !value.some(link => link.storeId === store.id));
    const add = (storeId: string) => { const store = stores.find(item => item.id === storeId); if (store) onChange([...value, { storeId, name: store.name[i18n.language as keyof typeof store.name] ?? store.name['pt-BR'], logo: store.logo, url: store.website }]); };
    return <div className="flex flex-col gap-2"><Select value="" onChange={e => add(e.target.value)} options={[{ value: '', label: t('stores.addToTitle') }, ...available.map(store => ({ value: store.id, label: store.name[i18n.language as keyof typeof store.name] ?? store.name['pt-BR'] ?? store.id }))]} />{value.map(link => <div key={link.storeId} className="flex items-center gap-2"><span className="min-w-28 truncate text-mr-small text-mr-fg">{link.name}</span><Input value={link.url} onChange={e => onChange(value.map(item => item.storeId === link.storeId ? { ...item, url: e.target.value } : item))} placeholder="https://..." /><Button variant="ghost" size="sm" icon={Trash2} aria-label={t('stores.removeFromTitle')} onClick={() => onChange(value.filter(item => item.storeId !== link.storeId))} /></div>)}</div>;
};
export default TitleStoresInput;
