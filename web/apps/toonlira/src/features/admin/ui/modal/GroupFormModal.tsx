import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import { Input } from '@ui/Input';
import LocalizedTextInput from '@ui/LocalizedTextInput';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';
import { useDirtyTracker } from '@shared/hook/useDirtyTracker';

import type { AdminGroup } from '../../model/admin.types';
import Field from '../parts/Field';

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

    const { dirty, reset: resetDirty } = useDirtyTracker(isOpen, { logo, banner, website, name, description });

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
        resetDirty();
    }, [group, isOpen, resetDirty]);

    const ptName = (name[DEFAULT_LANGUAGE] ?? '').trim();

    const save = () => {
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
        <Modal
            open={isOpen}
            onClose={onClose}
            title={group ? t('groupForm.editTitle', 'Editar Grupo') : t('groupForm.newTitle', 'Novo Grupo')}
            size="md"
            loading={isSubmitting}
            confirmClose={dirty && !isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('common.cancel', 'Cancelar')}
                    onCancel={onClose}
                    submitLabel={t('common.save', 'Salvar')}
                    onSubmit={save}
                    submitDisabled={!ptName}
                    submitting={isSubmitting}
                />
            }
        >
            <div className="flex flex-col gap-4">
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
                <Field label={t('groupForm.logo', 'Logo (URL)')}>
                    <Input type="text" placeholder="https://..." value={logo} onChange={e => setLogo(e.target.value)} />
                </Field>
                <Field label={t('groupForm.banner', 'Banner (URL)')}>
                    <Input type="text" placeholder="https://..." value={banner} onChange={e => setBanner(e.target.value)} />
                </Field>
                <Field label={t('groupForm.website', 'Website')}>
                    <Input type="text" placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} />
                </Field>
            </div>
        </Modal>
    );
};

export default GroupFormModal;
