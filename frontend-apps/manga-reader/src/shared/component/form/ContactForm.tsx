import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import FormWrapper from '@shared/component/form/FormWrapper';
import BaseInput from '@shared/component/input/BaseInput';
import BaseTextArea from '@shared/component/input/BaseTextArea';
import BaseSelect from '@shared/component/input/BaseSelect';
import RaisedButton from '@shared/component/button/RaisedButton';

import { usePublishWorkForm } from '@feature/contact';

const ContactForm = () => {
    const { t } = useTranslation('contact');
    const { draft, errors, isSubmitting, updateField, handleSubmit } =
        usePublishWorkForm();

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
        <FormWrapper
            onFormSubmit={handleSubmit}
            title={t('form.title')}
            subtitle={t('form.subtitle')}
        >
            <BaseInput
                label={t('form.labels.name')}
                type="text"
                placeholder={t('form.placeholders.name')}
                value={draft.name}
                onChange={e => updateField('name', e.target.value)}
                disabled={isSubmitting}
                error={errors.name}
                name="name"
            />
            <BaseInput
                label={t('form.labels.email')}
                type="email"
                placeholder={t('form.placeholders.email')}
                value={draft.email}
                onChange={e => updateField('email', e.target.value)}
                disabled={isSubmitting}
                error={errors.email}
                name="email"
            />
            <BaseSelect
                label={t('form.labels.workType')}
                options={workTypeOptions}
                value={draft.workType}
                onChange={e => updateField('workType', e.target.value)}
                disabled={isSubmitting}
                error={errors.workType}
                name="workType"
            />
            <BaseInput
                label={t('form.labels.workTitle')}
                type="text"
                placeholder={t('form.placeholders.workTitle')}
                value={draft.workTitle}
                onChange={e => updateField('workTitle', e.target.value)}
                disabled={isSubmitting}
                error={errors.workTitle}
                name="workTitle"
            />
            <BaseTextArea
                label={t('form.labels.synopsis')}
                placeholder={t('form.placeholders.synopsis')}
                value={draft.synopsis}
                onChange={e => updateField('synopsis', e.target.value)}
                disabled={isSubmitting}
                error={errors.synopsis}
                name="synopsis"
                rows={4}
            />
            <BaseInput
                label={t('form.labels.portfolioLink')}
                type="url"
                placeholder={t('form.placeholders.portfolioLink')}
                value={draft.portfolioLink}
                onChange={e => updateField('portfolioLink', e.target.value)}
                disabled={isSubmitting}
                error={errors.portfolioLink}
                name="portfolioLink"
            />
            <BaseTextArea
                label={t('form.labels.message')}
                placeholder={t('form.placeholders.message')}
                value={draft.message}
                onChange={e => updateField('message', e.target.value)}
                disabled={isSubmitting}
                error={errors.message}
                name="message"
                rows={6}
            />
            <RaisedButton
                text={
                    isSubmitting
                        ? t('form.actions.submitting')
                        : t('form.actions.submit')
                }
            />
        </FormWrapper>
    );
};

export default ContactForm;
