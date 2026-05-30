import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@ui/Input';
import AdminModal from './AdminModal';

type GrantSubscriptionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userId: string, planId: string) => void;
    isSubmitting: boolean;
};

const GrantSubscriptionModal = ({ isOpen, onClose, onSubmit, isSubmitting }: GrantSubscriptionModalProps) => {
    const { t } = useTranslation('admin');
    const [userId, setUserId] = useState('');
    const [planId, setPlanId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userId.trim() && planId.trim()) {
            onSubmit(userId.trim(), planId.trim());
        }
    };

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2">
                <h3 className="text-sm font-bold">{t('grantSubscription.title')}</h3>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('grantSubscription.userIdLabel')}</span>
                    <Input type="text" value={userId} onChange={e => setUserId(e.target.value)} placeholder={t('grantSubscription.userIdPlaceholder')} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('grantSubscription.planIdLabel')}</span>
                    <Input type="text" value={planId} onChange={e => setPlanId(e.target.value)} placeholder={t('grantSubscription.planIdPlaceholder')} />
                </div>

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30">
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !userId.trim() || !planId.trim()}
                        className="px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80 disabled:opacity-50"
                    >
                        {isSubmitting ? t('grantSubscription.confirming') : t('grantSubscription.confirm')}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
};

export default GrantSubscriptionModal;
