import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RadioGroup } from '@ui/Radio';
import AdminModal from './AdminModal';

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
    const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-4 p-2">
                <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold">{t('updatePaymentStatus.title')}</h3>
                    <p className="text-xs text-tertiary">
                        {t('updatePaymentStatus.paymentId')} <span className="font-mono">{paymentId.slice(0, 8)}</span>
                    </p>
                    <p className="text-xs text-tertiary">
                        {t('updatePaymentStatus.currentStatus')}{' '}
                        <span className="font-semibold">{t(`updatePaymentStatus.statuses.${currentStatus}`, currentStatus)}</span>
                    </p>
                </div>

                <RadioGroup
                    name="payment-status"
                    layout="vertical"
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={PAYMENT_STATUSES.map(status => ({
                        value: status,
                        label: t(`updatePaymentStatus.statuses.${status}`, status),
                    }))}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm border rounded-xs border-tertiary hover:bg-tertiary/30">
                        {t('updatePaymentStatus.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(selectedStatus)}
                        disabled={selectedStatus === currentStatus || isSubmitting}
                        className="px-3 py-1.5 text-sm font-semibold border rounded-xs bg-quaternary-opacity-25 border-quaternary-default hover:bg-quaternary-opacity-50 disabled:opacity-50"
                    >
                        {isSubmitting ? t('updatePaymentStatus.confirming') : t('updatePaymentStatus.confirm')}
                    </button>
                </div>
            </div>
        </AdminModal>
    );
};

export default UpdatePaymentStatusModal;
