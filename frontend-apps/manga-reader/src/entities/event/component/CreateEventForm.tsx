import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@ui/Input';
import { Textarea } from '@ui/Textarea';
import { Select } from '@ui/Select';
import { Checkbox } from '@ui/Checkbox';

import type { DraftEvent } from '../hook/useEventForm';
import type { EventType } from '../type/event.types';

import EventFormActions from './EventFormActions';
import EventFormPreview from './EventFormPreview';

type CreateEventFormProps = {
    draftEvent: DraftEvent;
    updateDraftField: <K extends keyof DraftEvent>(field: K, value: DraftEvent[K]) => void;
    toggleDraft: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
};

const CreateEventForm = ({ draftEvent, updateDraftField, toggleDraft, onSubmit, onCancel }: CreateEventFormProps) => {
    const { t } = useTranslation('event');

    const eventTypeOptions = [
        { value: 'Convenção' as EventType, label: t('types.convention') },
        { value: 'Lançamento' as EventType, label: t('types.launch') },
        { value: 'Live' as EventType, label: t('types.live') },
        { value: 'Workshop' as EventType, label: t('types.workshop') },
        { value: 'Meetup' as EventType, label: t('types.meetup') },
    ];

    const privacyOptions = [
        { value: 'public', label: t('form.privacy.public') },
        { value: 'members', label: t('form.privacy.members') },
    ];

    return (
        <section className="p-5 space-y-4 border rounded-2xl bg-secondary border-tertiary">
            <h3 className="text-xl font-semibold">{t('form.sectionTitle')}</h3>
            <form className="grid grid-cols-1 gap-3 lg:grid-cols-2" onSubmit={onSubmit}>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.title')}</span>
                    <Input
                        placeholder={t('form.placeholders.title')}
                        type="text"
                        value={draftEvent.title}
                        onChange={event => updateDraftField('title', event.target.value)}
                        name="title"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.type')}</span>
                    <Select
                        options={eventTypeOptions}
                        value={draftEvent.type}
                        onChange={event => updateDraftField('type', event.target.value as EventType)}
                        name="type"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.startDate')}</span>
                    <Input
                        placeholder=""
                        type="datetime-local"
                        value={draftEvent.startDate}
                        onChange={event => updateDraftField('startDate', event.target.value)}
                        name="startDate"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.endDate')}</span>
                    <Input
                        placeholder=""
                        type="datetime-local"
                        value={draftEvent.endDate}
                        onChange={event => updateDraftField('endDate', event.target.value)}
                        name="endDate"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.location')}</span>
                    <Input
                        placeholder={t('form.placeholders.location')}
                        type="text"
                        value={draftEvent.location}
                        onChange={event => updateDraftField('location', event.target.value)}
                        name="location"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.cover')}</span>
                    <Input
                        placeholder={t('form.placeholders.cover')}
                        type="url"
                        value={draftEvent.image}
                        onChange={event => updateDraftField('image', event.target.value)}
                        name="image"
                    />
                </div>
                <div className="lg:col-span-2">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('form.labels.description')}</span>
                        <Textarea
                            placeholder={t('form.placeholders.description')}
                            value={draftEvent.description}
                            onChange={event => updateDraftField('description', event.target.value)}
                            name="description"
                            rows={4}
                        />
                    </label>
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.ticketPrice')}</span>
                    <Input
                        placeholder={t('form.placeholders.ticketPrice')}
                        type="text"
                        value={draftEvent.ticketPrice}
                        onChange={event => updateDraftField('ticketPrice', event.target.value)}
                        name="ticketPrice"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.website')}</span>
                    <Input
                        placeholder={t('form.placeholders.website')}
                        type="url"
                        value={draftEvent.website}
                        onChange={event => updateDraftField('website', event.target.value)}
                        name="website"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.socials')}</span>
                    <Input
                        placeholder={t('form.placeholders.socials')}
                        type="text"
                        value={draftEvent.instagram}
                        onChange={event => updateDraftField('instagram', event.target.value)}
                        name="instagram"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.contact')}</span>
                    <Input
                        placeholder={t('form.placeholders.contact')}
                        type="text"
                        value={draftEvent.contact}
                        onChange={event => updateDraftField('contact', event.target.value)}
                        name="contact"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.maxParticipants')}</span>
                    <Input
                        placeholder={t('form.placeholders.maxParticipants')}
                        type="text"
                        value={draftEvent.maxParticipants}
                        onChange={event => updateDraftField('maxParticipants', event.target.value)}
                        name="maxParticipants"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('form.labels.privacy')}</span>
                    <Select
                        options={privacyOptions}
                        value={draftEvent.privacy}
                        onChange={event => updateDraftField('privacy', event.target.value)}
                        name="privacy"
                    />
                </div>
                <div className="lg:col-span-2">
                    <Checkbox
                        label={t('form.labels.approval')}
                        checked={draftEvent.approvalRequired}
                        onChange={e => updateDraftField('approvalRequired', e.target.checked)}
                        name="approvalRequired"
                    />
                </div>
                <EventFormActions asDraft={draftEvent.asDraft} toggleDraft={toggleDraft} onCancel={onCancel} />
            </form>
            <EventFormPreview draftEvent={draftEvent} />
        </section>
    );
};

export default CreateEventForm;
