import { useState } from 'react';

import BaseModal from '@shared/component/modal/base/BaseModal';

type UpdateSubscriptionStatusModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (status: string) => void;
    subscriptionId: string;
    currentStatus: string;
    isSubmitting: boolean;
};

const SUBSCRIPTION_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED'] as const;

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Ativa',
    EXPIRED: 'Expirada',
    CANCELLED: 'Cancelada',
};

const UpdateSubscriptionStatusModal = ({
    isOpen,
    onClose,
    onConfirm,
    subscriptionId,
    currentStatus,
    isSubmitting,
}: UpdateSubscriptionStatusModalProps) => {
    const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);

    return (
        <BaseModal isModalOpen={isOpen} closeModal={onClose}>
            <h3 className="text-sm font-bold">
                Atualizar status da assinatura
            </h3>
            <p className="text-xs text-tertiary">
                Assinatura:{' '}
                <span className="font-mono">{subscriptionId.slice(0, 8)}</span>
            </p>
            <p className="text-xs text-tertiary">
                Status atual:{' '}
                <span className="font-semibold">
                    {STATUS_LABELS[currentStatus] ?? currentStatus}
                </span>
            </p>

            <div className="flex flex-col gap-2 mt-2">
                {SUBSCRIPTION_STATUSES.map(status => (
                    <label
                        key={status}
                        className={`flex items-center gap-2 p-2 text-sm border rounded-xs cursor-pointer transition-colors ${
                            selectedStatus === status
                                ? 'border-quaternary-default bg-quaternary-opacity-25'
                                : 'border-tertiary hover:bg-tertiary/20'
                        }`}
                    >
                        <input
                            type="radio"
                            name="subscription-status"
                            value={status}
                            checked={selectedStatus === status}
                            onChange={() => setSelectedStatus(status)}
                            className="accent-quaternary-default"
                        />
                        {STATUS_LABELS[status]}
                    </label>
                ))}
            </div>

            <div className="flex gap-2 mt-3">
                <button
                    onClick={onClose}
                    className="flex-1 p-2 text-sm border rounded-xs border-tertiary hover:bg-tertiary/30"
                >
                    Cancelar
                </button>
                <button
                    onClick={() => onConfirm(selectedStatus)}
                    disabled={selectedStatus === currentStatus || isSubmitting}
                    className="flex-1 p-2 text-sm font-semibold border rounded-xs bg-quaternary-opacity-25 border-quaternary-default hover:bg-quaternary-opacity-50 disabled:opacity-50"
                >
                    {isSubmitting ? 'Salvando...' : 'Confirmar'}
                </button>
            </div>
        </BaseModal>
    );
};

export default UpdateSubscriptionStatusModal;
