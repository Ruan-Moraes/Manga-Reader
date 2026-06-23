import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Input } from '@ui/Input';

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

    useEffect(() => {
        if (!isOpen) return;
        setName(publisher?.name ?? '');
        setSlug(publisher?.slug ?? '');
        setSlugTouched(Boolean(publisher));
        setCountry(publisher?.country ?? '');
        setWebsite(publisher?.website ?? '');
    }, [publisher, isOpen]);

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
        });
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={publisher ? t('publisherForm.editTitle') : t('publisherForm.newTitle')}
            size="md"
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="primary" size="sm" disabled={!valid} loading={isSubmitting} onClick={save}>
                        {publisher ? t('common.save') : t('common.create')}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4 p-2">
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
                <Field label={t('publisherForm.country')} hint={t('publisherForm.countryHint')}>
                    <Input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="JP" maxLength={2} />
                </Field>
                <Field label={t('publisherForm.website')}>
                    <Input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
                </Field>
            </div>
        </Modal>
    );
};

export default PublisherFormModal;
