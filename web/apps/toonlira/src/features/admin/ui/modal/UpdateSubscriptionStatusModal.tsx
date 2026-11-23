import { useTranslation } from 'react-i18next';

import SelectStatusModal from '../parts/SelectStatusModal';

type UpdateSubscriptionStatusModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (status: string) => void;
    subscriptionId: string;
    currentStatus: string;
    isSubmitting: boolean;
};

const SUBSCRIPTION_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED'] as const;

const UpdateSubscriptionStatusModal = ({ isOpen, onClose, onConfirm, subscriptionId, currentStatus, isSubmitting }: UpdateSubscriptionStatusModalProps) => {
    const { t } = useTranslation('admin');

    return (
        <SelectStatusModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={t('updateSubscriptionStatus.title')}
            description={`${t('updateSubscriptionStatus.subscription')} ${subscriptionId.slice(0, 8)}`}
            fieldLabel={t('updateSubscriptionStatus.fieldLabel')}
            options={SUBSCRIPTION_STATUSES.map(status => ({ value: status, label: t(`updateSubscriptionStatus.statuses.${status}`, status) }))}
            currentValue={currentStatus}
            confirmLabel={t('updateSubscriptionStatus.confirm')}
            cancelLabel={t('updateSubscriptionStatus.cancel')}
            isSubmitting={isSubmitting}
        />
    );
};

export default UpdateSubscriptionStatusModal;
