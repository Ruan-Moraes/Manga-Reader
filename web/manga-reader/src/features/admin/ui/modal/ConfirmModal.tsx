import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';

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
            loading={isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('common.cancel')}
                    onCancel={onClose}
                    submitLabel={confirmLabel}
                    onSubmit={onConfirm}
                    submitting={isSubmitting}
                    danger={danger}
                />
            }
        >
            <p className="text-mr-body leading-relaxed text-mr-fg-muted">{message}</p>
        </Modal>
    );
};

export default ConfirmModal;
