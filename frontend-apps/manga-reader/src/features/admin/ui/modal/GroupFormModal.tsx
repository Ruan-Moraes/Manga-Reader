import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@ui/Input';
import LocalizedTextInput from '@ui/LocalizedTextInput';
import AdminModal from './AdminModal';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';

import type { AdminGroup } from '../../model/admin.types';

export type GroupFormSubmitPayload = {
    name: LocalizedString;
    description: LocalizedString;
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

const GroupFormModal = ({ isOpen, onClose, onSubmit, group, isSubmitting }: GroupFormModalProps) => {
    const { t } = useTranslation('admin');

    const [logo, setLogo] = useState('');
    const [banner, setBanner] = useState('');
    const [website, setWebsite] = useState('');
    const [name, setName] = useState<LocalizedString>({});
    const [description, setDescription] = useState<LocalizedString>({});

    useEffect(() => {
        if (group) {
            setLogo(group.logo ?? '');
            setBanner('');
            setWebsite('');
            setName(group.name ?? {});
            setDescription(group.description ?? {});
        } else {
            setLogo('');
            setBanner('');
            setWebsite('');
            setName({});
            setDescription({});
        }
    }, [group, isOpen]);

    const ptName = (name[DEFAULT_LANGUAGE] ?? '').trim();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ptName) return;

        onSubmit({
            name,
            description,
            ...(logo ? { logo } : {}),
            ...(banner ? { banner } : {}),
            ...(website ? { website } : {}),
        });
    };

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2">
                <h3 className="text-sm font-bold">{group ? t('groupForm.editTitle', 'Editar Grupo') : t('groupForm.newTitle', 'Novo Grupo')}</h3>

                <LocalizedTextInput label={t('groupForm.name', 'Nome')} value={name} onChange={setName} maxLength={100} />

                <LocalizedTextInput
                    label={t('groupForm.description', 'Descrição')}
                    value={description}
                    onChange={setDescription}
                    multiline
                    rows={4}
                    requiredLanguages={[]}
                    maxLength={2000}
                />

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('groupForm.logo', 'Logo (URL)')}</span>
                    <Input type="text" value={logo} onChange={e => setLogo(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('groupForm.banner', 'Banner (URL)')}</span>
                    <Input type="text" value={banner} onChange={e => setBanner(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('groupForm.website', 'Website')}</span>
                    <Input type="text" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30">
                        {t('common.cancel', 'Cancelar')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !ptName}
                        className="px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80 disabled:opacity-50"
                    >
                        {isSubmitting ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
};

export default GroupFormModal;
