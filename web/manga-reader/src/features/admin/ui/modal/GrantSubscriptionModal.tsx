import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Input } from '@ui/Input';

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

    useEffect(() => {
        if (isOpen) {
            setUserId('');
            setPlanId('');
        }
    }, [isOpen]);

    const valid = userId.trim().length > 0 && planId.trim().length > 0;

    const save = () => {
        if (valid) onSubmit(userId.trim(), planId.trim());
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={t('grantSubscription.title')}
            size="sm"
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="primary" size="sm" disabled={!valid} loading={isSubmitting} onClick={save}>
                        {t('grantSubscription.confirm')}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4 p-2">
                <label className="flex flex-col gap-1.5">
                    <span className="text-mr-small font-mr-bold text-mr-fg-muted">{t('grantSubscription.userIdLabel')}</span>
                    <Input type="text" value={userId} onChange={e => setUserId(e.target.value)} placeholder={t('grantSubscription.userIdPlaceholder')} />
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-mr-small font-mr-bold text-mr-fg-muted">{t('grantSubscription.planIdLabel')}</span>
                    <Input type="text" value={planId} onChange={e => setPlanId(e.target.value)} placeholder={t('grantSubscription.planIdPlaceholder')} />
                </label>
            </div>
        </Modal>
    );
};

export default GrantSubscriptionModal;
