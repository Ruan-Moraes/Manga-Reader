import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getAdminEventDetail } from '@feature/admin/service/adminEventService';
import useAdminEventActions from '@feature/admin/hook/useAdminEventActions';
import type { CreateEventRequest } from '@feature/admin/type/admin.types';

import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import BaseInput from '@shared/component/input/BaseInput';
import BaseSelect from '@shared/component/input/BaseSelect';
import BaseCheckbox from '@shared/component/input/BaseCheckbox';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';
import { useDomainLabels, LABEL_TYPES } from '@feature/label';

const DashboardEventForm = () => {
    const { t } = useTranslation('admin');

    const { eventId } = useParams<{ eventId: string }>();

    const navigate = useNavigate();

    const isEditing = Boolean(eventId);

    const { handleCreate, handleUpdate, handleDelete, isSubmitting } =
        useAdminEventActions();

    const { data: existing, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_EVENT_DETAIL, eventId],
        queryFn: () => getAdminEventDetail(eventId!),
        enabled: isEditing,
    });

    const { data: timelineOptions = [] } = useDomainLabels(LABEL_TYPES.EVENT_TIMELINE);
    const { data: statusOptions = [] } = useDomainLabels(LABEL_TYPES.EVENT_STATUS);
    const { data: typeOptions = [] } = useDomainLabels(LABEL_TYPES.EVENT_TYPE);

    type FormState = Omit<CreateEventRequest, 'title' | 'subtitle' | 'description'>;

    const [form, setForm] = useState<FormState>({
        startDate: '',
        endDate: '',
        timeline: 'UPCOMING',
        status: 'COMING_SOON',
        type: 'CONVENCAO',
        image: '',
        timezone: 'America/Sao_Paulo',
        locationLabel: '',
        locationCity: '',
        locationIsOnline: false,
        organizerName: '',
        organizerContact: '',
        priceLabel: '',
        isFeatured: false,
    });

    const [title, setTitle] = useState<LocalizedString>({});
    const [subtitle, setSubtitle] = useState<LocalizedString>({});
    const [description, setDescription] = useState<LocalizedString>({});

    useEffect(() => {
        if (existing) {
            setForm({
                startDate: existing.startDate.slice(0, 16),
                endDate: existing.endDate.slice(0, 16),
                timeline: existing.timeline,
                status: existing.status,
                type: existing.type,
                image: existing.image ?? '',
                timezone: existing.timezone ?? 'America/Sao_Paulo',
                locationLabel: existing.locationLabel ?? '',
                locationCity: existing.locationCity ?? '',
                locationIsOnline: existing.locationIsOnline,
                organizerName: existing.organizerName ?? '',
                priceLabel: existing.priceLabel ?? '',
                isFeatured: existing.isFeatured,
            });
            setTitle(existing.title ?? {});
            setSubtitle(existing.subtitle ?? {});
            setDescription(existing.description ?? {});
        }
    }, [existing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ptTitle = (title[DEFAULT_LANGUAGE] ?? '').trim();
        if (!ptTitle) return;

        const data: CreateEventRequest = {
            ...form,
            title,
            ...(Object.keys(subtitle).length ? { subtitle } : {}),
            ...(Object.keys(description).length ? { description } : {}),
        };

        if (isEditing && eventId) {
            const result = await handleUpdate(eventId, data);
            if (result) navigate('/Manga-Reader/dashboard/events');
        } else {
            const result = await handleCreate(data);
            if (result) navigate('/Manga-Reader/dashboard/events');
        }
    };

    const handleDeleteClick = async () => {
        if (!eventId || !confirm(t('dashboard.events.deleteConfirm'))) return;

        await handleDelete(eventId);

        navigate('/Manga-Reader/dashboard/events');
    };

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
                onClick={() => navigate('/Manga-Reader/dashboard/events')}
                className="flex items-center gap-1 text-sm w-fit hover:text-quaternary-default"
            >
                <FiArrowLeft size={14} />
                {t('common.back')}
            </button>

            <h1 className="text-lg font-bold">
                {isEditing
                    ? t('dashboard.events.editTitle')
                    : t('dashboard.events.newTitle')}
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <LocalizedTextInput
                    label={t('dashboard.events.form.title')}
                    value={title}
                    onChange={setTitle}
                    maxLength={200}
                />

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
                    <BaseInput
                        label={`${t('dashboard.events.form.startDate')} *`}
                        variant="outlined"
                        type="datetime-local"
                        placeholder=""
                        value={form.startDate}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                startDate: e.target.value,
                            }))
                        }
                    />
                    <BaseInput
                        label={`${t('dashboard.events.form.endDate')} *`}
                        variant="outlined"
                        type="datetime-local"
                        placeholder=""
                        value={form.endDate}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                endDate: e.target.value,
                            }))
                        }
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <BaseSelect
                        label={`${t('dashboard.events.form.timeline')} *`}
                        variant="outlined"
                        value={form.timeline}
                        onChange={e =>
                            setForm(f => ({ ...f, timeline: e.target.value }))
                        }
                        options={timelineOptions}
                    />
                    <BaseSelect
                        label={`${t('dashboard.events.form.status')} *`}
                        variant="outlined"
                        value={form.status}
                        onChange={e =>
                            setForm(f => ({ ...f, status: e.target.value }))
                        }
                        options={statusOptions}
                    />
                    <BaseSelect
                        label={`${t('dashboard.events.form.type')} *`}
                        variant="outlined"
                        value={form.type}
                        onChange={e =>
                            setForm(f => ({ ...f, type: e.target.value }))
                        }
                        options={typeOptions}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <BaseInput
                        label={t('dashboard.events.form.location')}
                        variant="outlined"
                        type="text"
                        placeholder=""
                        value={form.locationLabel ?? ''}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                locationLabel: e.target.value,
                            }))
                        }
                    />
                    <BaseInput
                        label={t('dashboard.events.form.city')}
                        variant="outlined"
                        type="text"
                        placeholder=""
                        value={form.locationCity ?? ''}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                locationCity: e.target.value,
                            }))
                        }
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <BaseInput
                        label={t('dashboard.events.form.organizer')}
                        variant="outlined"
                        type="text"
                        placeholder=""
                        value={form.organizerName ?? ''}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                organizerName: e.target.value,
                            }))
                        }
                    />
                    <BaseInput
                        label={t('dashboard.events.form.price')}
                        variant="outlined"
                        type="text"
                        placeholder={t(
                            'dashboard.events.form.pricePlaceholder',
                        )}
                        value={form.priceLabel ?? ''}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                priceLabel: e.target.value,
                            }))
                        }
                    />
                    <BaseInput
                        label={t('dashboard.events.form.image')}
                        variant="outlined"
                        type="text"
                        placeholder=""
                        value={form.image ?? ''}
                        onChange={e =>
                            setForm(f => ({ ...f, image: e.target.value }))
                        }
                    />
                </div>

                <div className="flex flex-wrap gap-4">
                    <BaseCheckbox
                        label={t('dashboard.events.form.online')}
                        checked={form.locationIsOnline}
                        onChange={checked =>
                            setForm(f => ({ ...f, locationIsOnline: checked }))
                        }
                    />
                    <BaseCheckbox
                        label={t('dashboard.events.form.featured')}
                        checked={form.isFeatured}
                        onChange={checked =>
                            setForm(f => ({ ...f, isFeatured: checked }))
                        }
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-dark disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('common.saving')
                            : isEditing
                              ? t('common.save')
                              : t('common.create')}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-semibold text-red-300 border rounded-xs border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"
                        >
                            {t('common.delete')}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default DashboardEventForm;
