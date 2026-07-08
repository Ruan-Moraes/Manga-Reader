import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import { Input } from '@ui/Input';
import { useDirtyTracker } from '@shared/hook/useDirtyTracker';

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

    const { dirty, reset: resetDirty } = useDirtyTracker(isOpen, { userId, planId });

    useEffect(() => {
        if (isOpen) {
            setUserId('');
            setPlanId('');
            resetDirty();
        }
    }, [isOpen, resetDirty]);

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
            loading={isSubmitting}
            confirmClose={dirty && !isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('common.cancel')}
                    onCancel={onClose}
                    submitLabel={t('grantSubscription.confirm')}
                    onSubmit={save}
                    submitDisabled={!valid}
                    submitting={isSubmitting}
                />
            }
        >
            <div className="flex flex-col gap-4">
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
