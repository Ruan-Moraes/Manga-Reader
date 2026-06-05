import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import LocalizedTextInput from '@ui/LocalizedTextInput';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';

import FormModal from './FormModal';

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
        setLabel(tag?.label ?? {});
    }, [tag, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const ptBR = (label[DEFAULT_LANGUAGE] ?? '').trim();
        if (!ptBR) return;
        onSubmit(label);
    };

    const ptBR = (label[DEFAULT_LANGUAGE] ?? '').trim();

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={tag ? t('tagForm.editTitle', 'Editar Tag') : t('tagForm.newTitle', 'Nova Tag')}
            onSubmit={handleSubmit}
            submitLabel={t('tagForm.save', 'Salvar')}
            submittingLabel={t('tagForm.saving', 'Salvando...')}
            cancelLabel={t('tagForm.cancel', 'Cancelar')}
            isSubmitting={isSubmitting}
            submitDisabled={!ptBR}
        >
            <LocalizedTextInput
                label={t('tagForm.label', 'Nome da tag')}
                value={label}
                onChange={setLabel}
                placeholder={t('tagForm.placeholder', 'Nome da tag')}
                maxLength={60}
            />
        </FormModal>
    );
};

export default TagFormModal;
