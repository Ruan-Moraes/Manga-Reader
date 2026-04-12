import { useState } from 'react';

import BaseInput from '@shared/component/input/BaseInput';
import BaseSelect from '@shared/component/input/BaseSelect';
import BaseTextArea from '@shared/component/input/BaseTextArea';
import BaseModal from '@shared/component/modal/base/BaseModal';

type BanUserModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, bannedUntil: string | null) => void;
    userName: string;
    isSubmitting: boolean;
};

const BanUserModal = ({
    isOpen,
    onClose,
    onConfirm,
    userName,
    isSubmitting,
}: BanUserModalProps) => {
    const [reason, setReason] = useState('');
    const [duration, setDuration] = useState('permanent');
    const [customDays, setCustomDays] = useState('7');

    const handleConfirm = () => {
        if (!reason.trim()) return;

        let bannedUntil: string | null = null;
        if (duration !== 'permanent') {
            const days = parseInt(customDays, 10) || 7;
            const date = new Date();
            date.setDate(date.getDate() + days);
            bannedUntil = date.toISOString();
        }

        onConfirm(reason.trim(), bannedUntil);
    };

    return (
        <BaseModal isModalOpen={isOpen} closeModal={onClose}>
            <h3 className="text-sm font-bold">Banir {userName}</h3>

            <BaseTextArea
                label="Motivo do ban"
                variant="outlined"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Descreva o motivo..."
                rows={3}
            />

            <BaseSelect
                label="Duração"
                variant="outlined"
                options={[
                    { value: 'permanent', label: 'Permanente' },
                    { value: 'temporary', label: 'Temporário (dias)' },
                ]}
                value={duration}
                onChange={e => setDuration(e.target.value)}
            />

            {duration === 'temporary' && (
                <BaseInput
                    label="Dias"
                    variant="outlined"
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={e => setCustomDays(e.target.value)}
                    placeholder="7"
                />
            )}

            <div className="flex gap-2 mt-2">
                <button
                    onClick={onClose}
                    className="flex-1 p-2 text-sm border rounded-xs border-tertiary hover:bg-tertiary/30"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={!reason.trim() || isSubmitting}
                    className="flex-1 p-2 text-sm font-semibold text-red-100 bg-red-600 rounded-xs hover:bg-red-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Banindo...' : 'Confirmar Ban'}
                </button>
            </div>
        </BaseModal>
    );
};

export default BanUserModal;
