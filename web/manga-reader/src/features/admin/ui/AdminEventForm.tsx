import { ROUTES } from '@shared/constant/ROUTES';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { ArrowLeft } from 'lucide-react';

import LocalizedTextInput from '@ui/LocalizedTextInput';
import { Input } from '@ui/Input';
import { Select } from '@ui/Select';
import { Checkbox } from '@ui/Checkbox';

import useEventFormState from '../model/useEventFormState';
import EventFormField from './parts/EventFormField';

const AdminEventForm = () => {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();

    const {
        isEditing,
        isLoading,
        isSubmitting,
        form,
        setForm,
        title,
        setTitle,
        subtitle,
        setSubtitle,
        description,
        setDescription,
        timelineOptions,
        statusOptions,
        typeOptions,
        handleSubmit,
        handleDeleteClick,
    } = useEventFormState();

    const setField =
        <K extends keyof typeof form>(key: K) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm(f => ({ ...f, [key]: e.target.value }));

    if (isEditing && isLoading) {
        return (
            <div className="flex flex-col gap-3">
                <div className="w-32 h-8 rounded-xs bg-tertiary/30 animate-pulse" />
                <div className="h-64 rounded-xs bg-tertiary/30 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() => navigate(`${WEB_BASE_URL}${ROUTES.DASHBOARD_EVENTS}`)}
                className="flex items-center gap-1 text-sm w-fit hover:text-quaternary-default"
            >
                <ArrowLeft size={14} />
                {t('common.back')}
            </button>
            <h1 className="text-lg font-bold">{isEditing ? t('dashboard.events.editTitle') : t('dashboard.events.newTitle')}</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <LocalizedTextInput label={t('dashboard.events.form.title')} value={title} onChange={setTitle} maxLength={200} />
                <LocalizedTextInput
                    label={t('dashboard.events.form.subtitle')}
                    value={subtitle}
                    onChange={setSubtitle}
                    requiredLanguages={[]}
                    maxLength={500}
                />
                <LocalizedTextInput
                    label={t('dashboard.events.form.description')}
                    value={description}
                    onChange={setDescription}
                    multiline
                    rows={4}
                    requiredLanguages={[]}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <EventFormField label={t('dashboard.events.form.startDate')} required>
                        <Input type="datetime-local" placeholder="" value={form.startDate} onChange={setField('startDate')} />
                    </EventFormField>
                    <EventFormField label={t('dashboard.events.form.endDate')} required>
                        <Input type="datetime-local" placeholder="" value={form.endDate} onChange={setField('endDate')} />
                    </EventFormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <EventFormField label={t('dashboard.events.form.timeline')} required>
                        <Select value={form.timeline} onChange={setField('timeline')} options={timelineOptions} />
                    </EventFormField>
                    <EventFormField label={t('dashboard.events.form.status')} required>
                        <Select value={form.status} onChange={setField('status')} options={statusOptions} />
                    </EventFormField>
                    <EventFormField label={t('dashboard.events.form.type')} required>
                        <Select value={form.type} onChange={setField('type')} options={typeOptions} />
                    </EventFormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <EventFormField label={t('dashboard.events.form.location')}>
                        <Input type="text" placeholder="" value={form.locationLabel ?? ''} onChange={setField('locationLabel')} />
                    </EventFormField>
                    <EventFormField label={t('dashboard.events.form.city')}>
                        <Input type="text" placeholder="" value={form.locationCity ?? ''} onChange={setField('locationCity')} />
                    </EventFormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <EventFormField label={t('dashboard.events.form.organizer')}>
                        <Input type="text" placeholder="" value={form.organizerName ?? ''} onChange={setField('organizerName')} />
                    </EventFormField>
                    <EventFormField label={t('dashboard.events.form.price')}>
                        <Input
                            type="text"
                            placeholder={t('dashboard.events.form.pricePlaceholder')}
                            value={form.priceLabel ?? ''}
                            onChange={setField('priceLabel')}
                        />
                    </EventFormField>
                    <EventFormField label={t('dashboard.events.form.image')}>
                        <Input type="text" placeholder="" value={form.image ?? ''} onChange={setField('image')} />
                    </EventFormField>
                </div>

                <div className="flex flex-wrap gap-4">
                    <Checkbox
                        label={t('dashboard.events.form.online')}
                        checked={form.locationIsOnline}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                locationIsOnline: e.target.checked,
                            }))
                        }
                    />
                    <Checkbox
                        label={t('dashboard.events.form.featured')}
                        checked={form.isFeatured}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                isFeatured: e.target.checked,
                            }))
                        }
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-dark disabled:opacity-50"
                    >
                        {isSubmitting ? t('common.saving') : isEditing ? t('common.save') : t('common.create')}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-semibold text-mr-danger border rounded-xs border-[rgba(255,120,79,0.4)] hover:bg-mr-danger-15 disabled:opacity-50"
                        >
                            {t('common.delete')}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AdminEventForm;
