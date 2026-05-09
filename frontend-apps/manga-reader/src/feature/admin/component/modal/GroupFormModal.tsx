import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseInput from '@shared/component/input/BaseInput';
import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import AdminModal from './AdminModal';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';

import type { AdminGroup } from '../../type/admin.types';

export type GroupFormSubmitPayload = {
    name: string;
    description?: string;
    nameI18n: LocalizedString;
    descriptionI18n: LocalizedString;
    logo?: string;
    banner?: string;
    website?: string;
};

type GroupFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: GroupFormSubmitPayload) => void;
    group?: AdminGroup | null;
    isSubmitting: boolean;
};

const GroupFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    group,
    isSubmitting,
}: GroupFormModalProps) => {
    const { t } = useTranslation('admin');

    const [logo, setLogo] = useState('');
    const [banner, setBanner] = useState('');
    const [website, setWebsite] = useState('');
    const [nameI18n, setNameI18n] = useState<LocalizedString>({});
    const [descriptionI18n, setDescriptionI18n] = useState<LocalizedString>({});

    useEffect(() => {
        if (group) {
            setLogo(group.logo ?? '');
            setBanner('');
            setWebsite('');
            setNameI18n(group.nameI18n ?? { [DEFAULT_LANGUAGE]: group.name });
            setDescriptionI18n(
                group.descriptionI18n ??
                    (group.description
                        ? { [DEFAULT_LANGUAGE]: group.description }
                        : {}),
            );
        } else {
            setLogo('');
            setBanner('');
            setWebsite('');
            setNameI18n({});
            setDescriptionI18n({});
        }
    }, [group, isOpen]);

    const ptName = (nameI18n[DEFAULT_LANGUAGE] ?? '').trim();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ptName) return;

        onSubmit({
            name: ptName,
            ...(descriptionI18n[DEFAULT_LANGUAGE]
                ? { description: descriptionI18n[DEFAULT_LANGUAGE] }
                : {}),
            nameI18n,
            descriptionI18n,
            ...(logo ? { logo } : {}),
            ...(banner ? { banner } : {}),
            ...(website ? { website } : {}),
        });
    };

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2">
                <h3 className="text-sm font-bold">
                    {group
                        ? t('groupForm.editTitle', 'Editar Grupo')
                        : t('groupForm.newTitle', 'Novo Grupo')}
                </h3>

                <LocalizedTextInput
                    label={t('groupForm.name', 'Nome')}
                    value={nameI18n}
                    onChange={setNameI18n}
                    maxLength={100}
                />

                <LocalizedTextInput
                    label={t('groupForm.description', 'Descrição')}
                    value={descriptionI18n}
                    onChange={setDescriptionI18n}
                    multiline
                    rows={4}
                    requiredLanguages={[]}
                    maxLength={2000}
                />

                <BaseInput
                    label={t('groupForm.logo', 'Logo (URL)')}
                    variant="outlined"
                    type="text"
                    value={logo}
                    onChange={e => setLogo(e.target.value)}
                />

                <BaseInput
                    label={t('groupForm.banner', 'Banner (URL)')}
                    variant="outlined"
                    type="text"
                    value={banner}
                    onChange={e => setBanner(e.target.value)}
                />

                <BaseInput
                    label={t('groupForm.website', 'Website')}
                    variant="outlined"
                    type="text"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                />

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30"
                    >
                        {t('common.cancel', 'Cancelar')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !ptName}
                        className="px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('common.saving', 'Salvando...')
                            : t('common.save', 'Salvar')}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
};

export default GroupFormModal;
