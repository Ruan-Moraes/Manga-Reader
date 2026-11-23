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

import type { AdminPublisher, CreatePublisherRequest } from '../../model/admin.types';

type PublisherFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreatePublisherRequest) => void;
    publisher?: AdminPublisher | null;
    isSubmitting: boolean;
};

const PublisherFormModal = ({ isOpen, onClose, onSubmit, publisher, isSubmitting }: PublisherFormModalProps) => {
    const { t } = useTranslation('admin');

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugTouched, setSlugTouched] = useState(false);
    const [country, setCountry] = useState('');
    const [website, setWebsite] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [description, setDescription] = useState('');
    const [aliases, setAliases] = useState('');

    const { dirty, reset: resetDirty } = useDirtyTracker(isOpen, { name, slug, country, website, logoUrl, description, aliases });

    useEffect(() => {
        if (!isOpen) return;
        setName(publisher?.name ?? '');
        setSlug(publisher?.slug ?? '');
        setSlugTouched(Boolean(publisher));
        setCountry(publisher?.country ?? '');
        setWebsite(publisher?.website ?? '');
        setLogoUrl(publisher?.logoUrl ?? '');
        setDescription(publisher?.description ?? '');
        setAliases(publisher?.aliases.map(alias => `${alias.type}|${alias.name}`).join('\n') ?? '');
        resetDirty();
    }, [publisher, isOpen, resetDirty]);

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
            country: country.trim() || undefined,
            website: website.trim() || undefined,
            logoUrl: logoUrl.trim() || undefined,
            description: description.trim() || undefined,
            aliases: aliases
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean)
                .slice(0, 20)
                .map(line => {
                    const [candidateType, ...nameParts] = line.split('|');
                    const allowed = ['ALTERNATE', 'ABBREVIATION', 'ORIGINAL'] as const;
                    const type = allowed.find(value => value === candidateType) ?? 'ALTERNATE';
                    const aliasName = nameParts.length > 0 ? nameParts.join('|').trim() : candidateType;
                    return { name: aliasName.slice(0, 255), type };
                }),
        });
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={publisher ? t('publisherForm.editTitle') : t('publisherForm.newTitle')}
            size="md"
            loading={isSubmitting}
            confirmClose={dirty && !isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('common.cancel')}
                    onCancel={onClose}
                    submitLabel={publisher ? t('common.save') : t('common.create')}
                    onSubmit={save}
                    submitDisabled={!valid}
                    submitting={isSubmitting}
                />
            }
        >
            <div className="flex flex-col gap-4">
                <FormRow columns={2}>
                    <Field label={t('publisherForm.name')}>
                        <Input type="text" value={name} onChange={e => handleNameChange(e.target.value)} placeholder={t('publisherForm.namePlaceholder')} autoFocus />
                    </Field>
                    <Field label={t('publisherForm.slug')} hint={t('publisherForm.slugHint')}>
                        <Input
                            type="text"
                            value={slug}
                            onChange={e => {
                                setSlug(e.target.value);
                                setSlugTouched(true);
                            }}
                            placeholder="slug-da-editora"
                        />
                    </Field>
                </FormRow>
                <Field label={t('publisherForm.logoUrl')}>
                    <Input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder={t('publisherForm.logoUrlPlaceholder')} />
                </Field>
                <Field label={t('publisherForm.description')}>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder={t('publisherForm.descriptionPlaceholder')} />
                </Field>
                <Field label={t('publisherForm.aliases')} hint={t('publisherForm.aliasesHint')}>
                    <Textarea value={aliases} onChange={e => setAliases(e.target.value)} rows={4} placeholder={t('publisherForm.aliasesPlaceholder')} />
                </Field>
                <FormRow columns={2}>
                    <Field label={t('publisherForm.country')} hint={t('publisherForm.countryHint')}>
                        <Input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="JP" maxLength={2} />
                    </Field>
                    <Field label={t('publisherForm.website')}>
                        <Input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
                    </Field>
                </FormRow>
            </div>
        </Modal>
    );
};

export default PublisherFormModal;
