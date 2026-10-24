import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import LocalizedTextInput from '@ui/LocalizedTextInput';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';
import { useDirtyTracker } from '@shared/hook/useDirtyTracker';

import type { AdminTag } from '../../model/admin.types';

type TagFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (label: LocalizedString) => void;
    tag?: AdminTag | null;
    isSubmitting: boolean;
};

const TagFormModal = ({ isOpen, onClose, onSubmit, tag, isSubmitting }: TagFormModalProps) => {
    const { t } = useTranslation('admin');

    const [label, setLabel] = useState<LocalizedString>({});
    const { dirty, reset: resetDirty } = useDirtyTracker(isOpen, label);

    useEffect(() => {
        if (isOpen) {
            setLabel(tag?.label ?? {});
            resetDirty();
        }
    }, [tag, isOpen, resetDirty]);

    const ptBR = (label[DEFAULT_LANGUAGE] ?? '').trim();
    const valid = ptBR.length > 0;

    const handleSubmit = () => {
        if (!valid) return;
        onSubmit(label);
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={tag ? t('tagForm.editTitle', 'Editar Tag') : t('tagForm.newTitle', 'Nova Tag')}
            size="sm"
            loading={isSubmitting}
            confirmClose={dirty && !isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('tagForm.cancel', 'Cancelar')}
                    onCancel={onClose}
                    submitLabel={t('tagForm.save', 'Salvar')}
                    onSubmit={handleSubmit}
                    submitDisabled={!valid}
                    submitting={isSubmitting}
                />
            }
        >
            <div>
                <LocalizedTextInput label={t('tagForm.label', 'Nome da tag')} value={label} onChange={setLabel} placeholder={t('tagForm.placeholder', 'Nome da tag')} maxLength={60} />
            </div>
        </Modal>
    );
};

export default TagFormModal;
