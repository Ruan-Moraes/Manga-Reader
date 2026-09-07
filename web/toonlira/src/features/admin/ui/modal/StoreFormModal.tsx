import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@ui/Modal'; import { ModalActions } from '@ui/ModalActions'; import { Input } from '@ui/Input'; import { Select } from '@ui/Select'; import LocalizedTextInput from '@ui/LocalizedTextInput';
import type { AdminStore, StoreRequest } from '../../model/admin.types';

type Props = { isOpen: boolean; onClose: () => void; store: AdminStore | null; isSubmitting: boolean; onSubmit: (data: StoreRequest) => void };
const StoreFormModal = ({ isOpen, onClose, store, isSubmitting, onSubmit }: Props) => {
    const { t } = useTranslation('admin'); const [name, setName] = useState({}); const [website, setWebsite] = useState(''); const [logo, setLogo] = useState(''); const [icon, setIcon] = useState(''); const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE'); const [displayOrder, setDisplayOrder] = useState(0);
    useEffect(() => { if (isOpen) { setName(store?.name ?? {}); setWebsite(store?.website ?? ''); setLogo(store?.logo ?? ''); setIcon(store?.icon ?? ''); setStatus(store?.status ?? 'ACTIVE'); setDisplayOrder(store?.displayOrder ?? 0); } }, [isOpen, store]);
    const valid = Boolean(Object.values(name).find((value): value is string => typeof value === 'string' && value.trim().length > 0)) && website.trim().length > 0;
    return <Modal open={isOpen} onClose={onClose} title={store ? t('stores.edit') : t('stores.new')} size="md" loading={isSubmitting} footer={<ModalActions cancelLabel={t('common.cancel')} onCancel={onClose} submitLabel={store ? t('common.save') : t('common.create')} onSubmit={() => valid && onSubmit({ name, website, logo: logo || null, icon: icon || null, status, displayOrder })} submitDisabled={!valid} submitting={isSubmitting} />}><div className="flex flex-col gap-4"><LocalizedTextInput label={t('stores.name')} value={name} onChange={setName} maxLength={100} /><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder={t('stores.website')} /><Input value={logo} onChange={e => setLogo(e.target.value)} placeholder={t('stores.logo')} /><Input value={icon} onChange={e => setIcon(e.target.value)} placeholder={t('stores.icon')} /><Select value={status} onChange={e => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')} options={[{ value: 'ACTIVE', label: t('stores.active') }, { value: 'INACTIVE', label: t('stores.inactive') }]} /><Input type="number" min="0" value={displayOrder} onChange={e => setDisplayOrder(Number(e.target.value))} /></div></Modal>;
};
export default StoreFormModal;
