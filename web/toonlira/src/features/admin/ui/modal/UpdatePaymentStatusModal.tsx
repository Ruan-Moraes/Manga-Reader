import { useTranslation } from 'react-i18next';

import SelectStatusModal from '../parts/SelectStatusModal';

type UpdatePaymentStatusModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (status: string) => void;
    paymentId: string;
    currentStatus: string;
    isSubmitting: boolean;
};

const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] as const;

const UpdatePaymentStatusModal = ({ isOpen, onClose, onConfirm, paymentId, currentStatus, isSubmitting }: UpdatePaymentStatusModalProps) => {
    const { t } = useTranslation('admin');

    return (
        <SelectStatusModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={t('updatePaymentStatus.title')}
            description={`${t('updatePaymentStatus.paymentId')} ${paymentId.slice(0, 8)}`}
            fieldLabel={t('updatePaymentStatus.fieldLabel')}
            options={PAYMENT_STATUSES.map(status => ({ value: status, label: t(`updatePaymentStatus.statuses.${status}`, status) }))}
            currentValue={currentStatus}
            confirmLabel={t('updatePaymentStatus.confirm')}
            cancelLabel={t('updatePaymentStatus.cancel')}
            isSubmitting={isSubmitting}
        />
    );
};

export default UpdatePaymentStatusModal;
