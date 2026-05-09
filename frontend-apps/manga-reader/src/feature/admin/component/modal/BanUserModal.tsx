import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseInput from '@shared/component/input/BaseInput';
import BaseSelect from '@shared/component/input/BaseSelect';
import BaseTextArea from '@shared/component/input/BaseTextArea';
import AdminModal from './AdminModal';

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
    const { t } = useTranslation('admin');
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
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-4 p-2">
                <h3 className="text-sm font-bold">
                    {t('banUser.title', { name: userName })}
                </h3>

                <BaseTextArea
                    label={t('banUser.reasonLabel')}
                    variant="outlined"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder={t('banUser.reasonPlaceholder')}
                    rows={3}
                />

                <BaseSelect
                    label={t('banUser.durationLabel')}
                    variant="outlined"
                    options={[
                        {
                            value: 'permanent',
                            label: t('banUser.durationPermanent'),
                        },
                        {
                            value: 'temporary',
                            label: t('banUser.durationTemporary'),
                        },
                    ]}
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                />

                {duration === 'temporary' && (
                    <BaseInput
                        label={t('banUser.daysLabel')}
                        variant="outlined"
                        type="number"
                        min="1"
                        max="365"
                        value={customDays}
                        onChange={e => setCustomDays(e.target.value)}
                        placeholder={t('banUser.daysPlaceholder')}
                    />
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm border rounded-xs border-tertiary hover:bg-tertiary/30"
                    >
                        {t('banUser.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!reason.trim() || isSubmitting}
                        className="px-3 py-1.5 text-sm font-semibold text-red-100 bg-red-600 rounded-xs hover:bg-red-700 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('banUser.confirming')
                            : t('banUser.confirm')}
                    </button>
                </div>
            </div>
        </AdminModal>
    );
};

export default BanUserModal;
