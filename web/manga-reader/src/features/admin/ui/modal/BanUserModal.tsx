import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import { Input } from '@ui/Input';
import { Select } from '@ui/Select';
import { Textarea } from '@ui/Textarea';
import { useDirtyTracker } from '@shared/hook/useDirtyTracker';

type BanUserModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, bannedUntil: string | null) => void;
    userName: string;
    isSubmitting: boolean;
};

const BanUserModal = ({ isOpen, onClose, onConfirm, userName, isSubmitting }: BanUserModalProps) => {
    const { t } = useTranslation('admin');
    const [reason, setReason] = useState('');
    const [duration, setDuration] = useState('permanent');
    const [customDays, setCustomDays] = useState('7');

    const { dirty, reset: resetDirty } = useDirtyTracker(isOpen, { reason, duration, customDays });

    useEffect(() => {
        if (isOpen) {
            setReason('');
            setDuration('permanent');
            setCustomDays('7');
            resetDirty();
        }
    }, [isOpen, resetDirty]);

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
        <Modal
            open={isOpen}
            onClose={onClose}
            title={t('banUser.title', { name: userName })}
            size="sm"
            danger
            loading={isSubmitting}
            confirmClose={dirty && !isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('banUser.cancel')}
                    onCancel={onClose}
                    submitLabel={t('banUser.confirm')}
                    onSubmit={handleConfirm}
                    submitDisabled={!reason.trim()}
                    submitting={isSubmitting}
                    danger
                />
            }
        >
            <div className="flex flex-col gap-4">
                <p className="text-mr-body leading-relaxed text-mr-fg-muted">
                    <Trans i18nKey="banUser.warning" ns="admin" values={{ name: userName }} components={{ b: <b className="text-mr-fg" /> }} />
                </p>

                <label className="flex flex-col gap-1.5">
                    <span className="text-mr-small font-mr-bold text-mr-fg-muted">{t('banUser.reasonLabel')}</span>
                    <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={t('banUser.reasonPlaceholder')} rows={3} />
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className="text-mr-small font-mr-bold text-mr-fg-muted">{t('banUser.durationLabel')}</span>
                    <Select
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                        options={[
                            { value: 'permanent', label: t('banUser.durationPermanent') },
                            { value: 'temporary', label: t('banUser.durationTemporary') },
                        ]}
                    />
                </label>

                {duration === 'temporary' && (
                    <label className="flex flex-col gap-1.5">
                        <span className="text-mr-small font-mr-bold text-mr-fg-muted">{t('banUser.daysLabel')}</span>
                        <Input type="number" min="1" max="365" value={customDays} onChange={e => setCustomDays(e.target.value)} placeholder={t('banUser.daysPlaceholder')} />
                    </label>
                )}
            </div>
        </Modal>
    );
};

export default BanUserModal;
