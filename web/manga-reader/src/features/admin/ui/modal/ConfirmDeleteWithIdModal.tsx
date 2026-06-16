import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Input } from '@ui/Input';

type ConfirmDeleteWithIdModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    entityId: string;
    title: string;
    message: string;
    isSubmitting: boolean;
};

const ConfirmDeleteWithIdModal = ({ isOpen, onClose, onConfirm, entityId, title, message, isSubmitting }: ConfirmDeleteWithIdModalProps) => {
    const { t } = useTranslation('admin');
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (!isOpen) setInputValue('');
    }, [isOpen]);

    const locked = inputValue.trim() !== entityId;

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            danger
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="ghost" size="sm" danger disabled={locked} loading={isSubmitting} onClick={() => !locked && onConfirm()}>
                        {t('common.delete')}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-3">
                <p className="text-mr-body leading-relaxed text-mr-fg-muted">{message}</p>
                <label className="flex flex-col gap-1.5">
                    <span className="text-mr-small font-mr-bold text-mr-fg-muted">
                        {t('common.deleteIdPrompt')} <code className="font-mr-mono text-mr-accent">{entityId}</code>
                    </span>
                    <Input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={entityId} autoComplete="off" autoFocus />
                </label>
            </div>
        </Modal>
    );
};

export default ConfirmDeleteWithIdModal;
