import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';

type ConfirmModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: ReactNode;
    confirmLabel: string;
    danger?: boolean;
    isSubmitting?: boolean;
};

/** Confirmação simples (sem "digite o ID"). Para destrutivo leve usar `danger`. */
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel, danger = false, isSubmitting = false }: ConfirmModalProps) => {
    const { t } = useTranslation('admin');

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            danger={danger}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="ghost" size="sm" danger={danger} loading={isSubmitting} onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <p className="text-mr-body leading-relaxed text-mr-fg-muted">{message}</p>
        </Modal>
    );
};

export default ConfirmModal;
