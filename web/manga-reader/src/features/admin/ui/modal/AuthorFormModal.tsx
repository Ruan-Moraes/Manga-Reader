import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import { Input } from '@ui/Input';
import { Textarea } from '@ui/Textarea';
import { FormRow } from '@ui/FormRow';
import { useDirtyTracker } from '@shared/hook/useDirtyTracker';

import { slugify } from '../../model/slugify';
import Field from '../parts/Field';

import type { AdminAuthor, CreateAuthorRequest } from '../../model/admin.types';

type AuthorFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAuthorRequest) => void;
    author?: AdminAuthor | null;
    isSubmitting: boolean;
};

const AuthorFormModal = ({ isOpen, onClose, onSubmit, author, isSubmitting }: AuthorFormModalProps) => {
    const { t } = useTranslation('admin');

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugTouched, setSlugTouched] = useState(false);
    const [bio, setBio] = useState('');
    const [nationality, setNationality] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [aliases, setAliases] = useState('');

    const { dirty, reset: resetDirty } = useDirtyTracker(isOpen, { name, slug, bio, nationality, imageUrl, aliases });

    useEffect(() => {
        if (!isOpen) return;
        setName(author?.name ?? '');
        setSlug(author?.slug ?? '');
        setSlugTouched(Boolean(author));
        setBio(author?.bio ?? '');
        setNationality(author?.nationality ?? '');
        setImageUrl(author?.imageUrl ?? '');
        setAliases(author?.aliases.map(alias => `${alias.type}|${alias.name}`).join('\n') ?? '');
        resetDirty();
    }, [author, isOpen, resetDirty]);

    const handleNameChange = (value: string) => {
        setName(value);
        if (!slugTouched) setSlug(slugify(value));
    };

    const valid = name.trim().length > 0;

    const save = () => {
        if (!valid) return;
        onSubmit({
            name: name.trim(),
            slug: slug.trim() || undefined,
            bio: bio.trim() || undefined,
            nationality: nationality.trim() || undefined,
            imageUrl: imageUrl.trim() || undefined,
            aliases: aliases
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean)
                .slice(0, 20)
                .map(line => {
                    const [candidateType, ...nameParts] = line.split('|');
                    const type = candidateType === 'PEN_NAME' ? 'PEN_NAME' : 'ALTERNATE';
                    const aliasName = nameParts.length > 0 ? nameParts.join('|').trim() : candidateType;
                    return { name: aliasName.slice(0, 255), type };
                }),
        });
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={author ? t('authorForm.editTitle') : t('authorForm.newTitle')}
            size="md"
            loading={isSubmitting}
            confirmClose={dirty && !isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('common.cancel')}
                    onCancel={onClose}
                    submitLabel={author ? t('common.save') : t('common.create')}
                    onSubmit={save}
                    submitDisabled={!valid}
                    submitting={isSubmitting}
                />
            }
        >
            <div className="flex flex-col gap-4">
                <FormRow columns={2}>
                    <Field label={t('authorForm.name')}>
                        <Input type="text" value={name} onChange={e => handleNameChange(e.target.value)} placeholder={t('authorForm.namePlaceholder')} autoFocus />
                    </Field>
                    <Field label={t('authorForm.slug')} hint={t('authorForm.slugHint')}>
                        <Input
                            type="text"
                            value={slug}
                            onChange={e => {
                                setSlug(e.target.value);
                                setSlugTouched(true);
                            }}
                            placeholder="slug-do-autor"
                        />
                    </Field>
                </FormRow>
                <Field label={t('authorForm.bio')}>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder={t('authorForm.bioPlaceholder')} />
                </Field>
                <Field label={t('authorForm.nationality')} hint={t('authorForm.nationalityHint')}>
                    <Input type="text" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="JP" maxLength={2} />
                </Field>
                <Field label={t('authorForm.imageUrl')}>
                    <Input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder={t('authorForm.imageUrlPlaceholder')} />
                </Field>
                <Field label={t('authorForm.aliases')} hint={t('authorForm.aliasesHint')}>
                    <Textarea value={aliases} onChange={e => setAliases(e.target.value)} rows={4} placeholder={t('authorForm.aliasesPlaceholder')} />
                </Field>
            </div>
        </Modal>
    );
};

export default AuthorFormModal;
