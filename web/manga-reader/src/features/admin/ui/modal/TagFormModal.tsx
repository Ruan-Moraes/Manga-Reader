import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import LocalizedTextInput from '@ui/LocalizedTextInput';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';

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

    useEffect(() => {
        if (isOpen) setLabel(tag?.label ?? {});
    }, [tag, isOpen]);

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
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {t('tagForm.cancel', 'Cancelar')}
                    </Button>
                    <Button variant="primary" size="sm" disabled={!valid} loading={isSubmitting} onClick={handleSubmit}>
                        {t('tagForm.save', 'Salvar')}
                    </Button>
                </>
            }
        >
            <div className="p-2">
                <LocalizedTextInput label={t('tagForm.label', 'Nome da tag')} value={label} onChange={setLabel} placeholder={t('tagForm.placeholder', 'Nome da tag')} maxLength={60} />
            </div>
        </Modal>
    );
};

export default TagFormModal;
