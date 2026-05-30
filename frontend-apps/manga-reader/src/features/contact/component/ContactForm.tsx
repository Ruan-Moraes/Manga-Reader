import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@ui/Input';
import { Textarea } from '@ui/Textarea';
import { Select } from '@ui/Select';
import { Button } from '@ui/Button';

import usePublishWorkForm from '../hook/usePublishWorkForm';

const ContactForm = () => {
    const { t } = useTranslation('contact');
    const { draft, errors, isSubmitting, updateField, handleSubmit } = usePublishWorkForm();

    const workTypeOptions = useMemo(
        () => [
            { value: '', label: t('form.workTypes.placeholder') },
            { value: 'manga', label: t('form.workTypes.manga') },
            { value: 'webtoon', label: t('form.workTypes.webtoon') },
            { value: 'fanfic', label: t('form.workTypes.fanfic') },
            { value: 'fanart', label: t('form.workTypes.fanart') },
            { value: 'other', label: t('form.workTypes.other') },
        ],
        [t],
    );

    return (
        <div className="flex flex-col gap-2">
            <form onSubmit={handleSubmit}>
                <fieldset className="flex flex-col gap-6 p-4 border-2 rounded-xs border-tertiary">
                    <legend className="px-2 text-lg font-bold text-shadow-highlight">{t('form.title')}</legend>
                    <p className="text-sm text-tertiary-default">{t('form.subtitle')}</p>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('form.labels.name')}</span>
                        <Input
                            type="text"
                            placeholder={t('form.placeholders.name')}
                            value={draft.name}
                            onChange={e => updateField('name', e.target.value)}
                            disabled={isSubmitting}
                            error={errors.name}
                            name="name"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('form.labels.email')}</span>
                        <Input
                            type="email"
                            placeholder={t('form.placeholders.email')}
                            value={draft.email}
                            onChange={e => updateField('email', e.target.value)}
                            disabled={isSubmitting}
                            error={errors.email}
                            name="email"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('form.labels.workType')}</span>
                        <Select
                            options={workTypeOptions}
                            value={draft.workType}
                            onChange={e => updateField('workType', e.target.value)}
                            disabled={isSubmitting}
                            error={errors.workType}
                            name="workType"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('form.labels.workTitle')}</span>
                        <Input
                            type="text"
                            placeholder={t('form.placeholders.workTitle')}
                            value={draft.workTitle}
                            onChange={e => updateField('workTitle', e.target.value)}
                            disabled={isSubmitting}
                            error={errors.workTitle}
                            name="workTitle"
                        />
                    </div>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('form.labels.synopsis')}</span>
                        <Textarea
                            placeholder={t('form.placeholders.synopsis')}
                            value={draft.synopsis}
                            onChange={e => updateField('synopsis', e.target.value)}
                            disabled={isSubmitting}
                            error={errors.synopsis}
                            name="synopsis"
                            rows={4}
                        />
                    </label>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('form.labels.portfolioLink')}</span>
                        <Input
                            type="url"
                            placeholder={t('form.placeholders.portfolioLink')}
                            value={draft.portfolioLink}
                            onChange={e => updateField('portfolioLink', e.target.value)}
                            disabled={isSubmitting}
                            error={errors.portfolioLink}
                            name="portfolioLink"
                        />
                    </div>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('form.labels.message')}</span>
                        <Textarea
                            placeholder={t('form.placeholders.message')}
                            value={draft.message}
                            onChange={e => updateField('message', e.target.value)}
                            disabled={isSubmitting}
                            error={errors.message}
                            name="message"
                            rows={6}
                        />
                    </label>
                    <Button type="submit" block disabled={isSubmitting}>
                        {isSubmitting ? t('form.actions.submitting') : t('form.actions.submit')}
                    </Button>
                </fieldset>
            </form>
        </div>
    );
};

export default ContactForm;
