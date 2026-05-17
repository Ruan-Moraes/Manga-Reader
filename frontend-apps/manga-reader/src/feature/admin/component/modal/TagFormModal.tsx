import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import AdminModal from './AdminModal';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';

import type { AdminTag } from '../../type/admin.types';

type TagFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (label: LocalizedString) => void;
    tag?: AdminTag | null;
    isSubmitting: boolean;
};

const TagFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    tag,
    isSubmitting,
}: TagFormModalProps) => {
    const { t } = useTranslation('admin');

    const [label, setLabel] = useState<LocalizedString>({});

    useEffect(() => {
        if (!tag) {
            setLabel({});
            return;
        }
        setLabel(tag.label ?? {});
    }, [tag, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const ptBR = (label[DEFAULT_LANGUAGE] ?? '').trim();
        if (!ptBR) return;
        onSubmit(label);
    };

    const ptBR = (label[DEFAULT_LANGUAGE] ?? '').trim();

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2">
                <h3 className="text-sm font-bold">
                    {tag
                        ? t('tagForm.editTitle', 'Editar Tag')
                        : t('tagForm.newTitle', 'Nova Tag')}
                </h3>
                <LocalizedTextInput
                    label={t('tagForm.label', 'Nome da tag')}
                    value={label}
                    onChange={setLabel}
                    placeholder={t('tagForm.placeholder', 'Nome da tag')}
                    maxLength={60}
                />
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30"
                    >
                        {t('tagForm.cancel', 'Cancelar')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !ptBR}
                        className="px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('tagForm.saving', 'Salvando...')
                            : t('tagForm.save', 'Salvar')}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
};

export default TagFormModal;
