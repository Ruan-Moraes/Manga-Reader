import { useTranslation } from 'react-i18next';

import BaseInput from '@shared/component/input/BaseInput';
import BaseTextArea from '@shared/component/input/BaseTextArea';
import BaseSelect from '@shared/component/input/BaseSelect';
import BaseCheckbox from '@shared/component/input/BaseCheckbox';

import { eventTypes } from '../service/eventService';
import type { DraftEvent } from '../hook/useEventForm';
import type { EventType } from '../type/event.types';
import type { FormEvent } from 'react';

type CreateEventFormProps = {
    draftEvent: DraftEvent;
    updateDraftField: <K extends keyof DraftEvent>(
        field: K,
        value: DraftEvent[K],
    ) => void;
    toggleDraft: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
};

const EVENT_TYPE_OPTIONS = eventTypes.map(item => ({
    value: item,
    label: item,
}));

const CreateEventForm = ({
    draftEvent,
    updateDraftField,
    toggleDraft,
    onSubmit,
    onCancel,
}: CreateEventFormProps) => {
    const { t, i18n } = useTranslation('event');

    const privacyOptions = [
        { value: 'public', label: t('form.privacy.public') },
        { value: 'members', label: t('form.privacy.members') },
    ];

    return (
        <section className="p-5 space-y-4 border rounded-2xl bg-secondary border-tertiary">
            <h3 className="text-xl font-semibold">
                {t('form.sectionTitle')}
            </h3>
            <form
                className="grid grid-cols-1 gap-3 lg:grid-cols-2"
                onSubmit={onSubmit}
            >
                <BaseInput
                    label={t('form.labels.title')}
                    placeholder={t('form.placeholders.title')}
                    type="text"
                    value={draftEvent.title}
                    onChange={event =>
                        updateDraftField('title', event.target.value)
                    }
                    name="title"
                />
                <BaseSelect
                    label={t('form.labels.type')}
                    options={EVENT_TYPE_OPTIONS}
                    value={draftEvent.type}
                    onChange={event =>
                        updateDraftField(
                            'type',
                            event.target.value as EventType,
                        )
                    }
                    name="type"
                />
                <BaseInput
                    label={t('form.labels.startDate')}
                    placeholder=""
                    type="datetime-local"
                    value={draftEvent.startDate}
                    onChange={event =>
                        updateDraftField('startDate', event.target.value)
                    }
                    name="startDate"
                />
                <BaseInput
                    label={t('form.labels.endDate')}
                    placeholder=""
                    type="datetime-local"
                    value={draftEvent.endDate}
                    onChange={event =>
                        updateDraftField('endDate', event.target.value)
                    }
                    name="endDate"
                />
                <BaseInput
                    label={t('form.labels.location')}
                    placeholder={t('form.placeholders.location')}
                    type="text"
                    value={draftEvent.location}
                    onChange={event =>
                        updateDraftField('location', event.target.value)
                    }
                    name="location"
                />
                <BaseInput
                    label={t('form.labels.cover')}
                    placeholder={t('form.placeholders.cover')}
                    type="url"
                    value={draftEvent.image}
                    onChange={event =>
                        updateDraftField('image', event.target.value)
                    }
                    name="image"
                />
                <div className="lg:col-span-2">
                    <BaseTextArea
                        label={t('form.labels.description')}
                        placeholder={t('form.placeholders.description')}
                        value={draftEvent.description}
                        onChange={event =>
                            updateDraftField(
                                'description',
                                event.target.value,
                            )
                        }
                        name="description"
                        rows={4}
                    />
                </div>
                <BaseInput
                    label={t('form.labels.ticketPrice')}
                    placeholder={t('form.placeholders.ticketPrice')}
                    type="text"
                    value={draftEvent.ticketPrice}
                    onChange={event =>
                        updateDraftField('ticketPrice', event.target.value)
                    }
                    name="ticketPrice"
                />
                <BaseInput
                    label={t('form.labels.website')}
                    placeholder={t('form.placeholders.website')}
                    type="url"
                    value={draftEvent.website}
                    onChange={event =>
                        updateDraftField('website', event.target.value)
                    }
                    name="website"
                />
                <BaseInput
                    label={t('form.labels.socials')}
                    placeholder={t('form.placeholders.socials')}
                    type="text"
                    value={draftEvent.instagram}
                    onChange={event =>
                        updateDraftField('instagram', event.target.value)
                    }
                    name="instagram"
                />
                <BaseInput
                    label={t('form.labels.contact')}
                    placeholder={t('form.placeholders.contact')}
                    type="text"
                    value={draftEvent.contact}
                    onChange={event =>
                        updateDraftField('contact', event.target.value)
                    }
                    name="contact"
                />
                <BaseInput
                    label={t('form.labels.maxParticipants')}
                    placeholder={t('form.placeholders.maxParticipants')}
                    type="text"
                    value={draftEvent.maxParticipants}
                    onChange={event =>
                        updateDraftField(
                            'maxParticipants',
                            event.target.value,
                        )
                    }
                    name="maxParticipants"
                />
                <BaseSelect
                    label={t('form.labels.privacy')}
                    options={privacyOptions}
                    value={draftEvent.privacy}
                    onChange={event =>
                        updateDraftField('privacy', event.target.value)
                    }
                    name="privacy"
                />
                <div className="lg:col-span-2">
                    <BaseCheckbox
                        label={t('form.labels.approval')}
                        checked={draftEvent.approvalRequired}
                        onChange={checked =>
                            updateDraftField('approvalRequired', checked)
                        }
                        name="approvalRequired"
                    />
                </div>
                <div className="flex flex-wrap gap-2 lg:col-span-2">
                    <button
                        type="submit"
                        className="px-4 py-2 text-white bg-purple-600 rounded-lg"
                    >
                        {t('form.actions.submit')}
                    </button>
                    <button
                        type="button"
                        onClick={toggleDraft}
                        className="px-4 py-2 border rounded-lg border-tertiary"
                    >
                        {draftEvent.asDraft
                            ? t('form.actions.draftSaved')
                            : t('form.actions.saveDraft')}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border rounded-lg border-tertiary"
                    >
                        {t('form.actions.cancel')}
                    </button>
                </div>
            </form>
            <div className="p-4 text-sm border rounded-lg border-tertiary bg-primary">
                <p className="mb-2 font-semibold">
                    {t('form.preview.title')}
                </p>
                <p className="font-medium">
                    {draftEvent.title || t('form.preview.placeholderTitle')}
                </p>
                <p>
                    {draftEvent.description ||
                        t('form.preview.placeholderDescription')}
                </p>
                <p className="mt-1 text-tertiary">
                    {draftEvent.startDate
                        ? t('form.preview.startAt', {
                              date: new Date(
                                  draftEvent.startDate,
                              ).toLocaleString(i18n.language),
                          })
                        : t('form.preview.pickDateTime')}
                </p>
            </div>
        </section>
    );
};

export default CreateEventForm;
