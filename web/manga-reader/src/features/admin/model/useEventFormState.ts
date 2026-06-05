import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { ROUTES } from '@shared/constant/ROUTES';
import { getAdminEventDetail } from '../api/adminEventService';
import useAdminEventActions from './useAdminEventActions';
import type { CreateEventRequest } from '../model/admin.types';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';
import { useDomainLabels, LABEL_TYPES } from '@entities/label';

type FormState = Omit<CreateEventRequest, 'title' | 'subtitle' | 'description'>;

const DEFAULT_FORM: FormState = {
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
};

const useEventFormState = () => {
    const { t } = useTranslation('admin');
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(eventId);

    const { handleCreate, handleUpdate, handleDelete, isSubmitting } = useAdminEventActions();

    const { data: existing, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_EVENT_DETAIL, eventId],
        queryFn: () => getAdminEventDetail(eventId!),
        enabled: isEditing,
    });

    const { data: timelineOptions = [] } = useDomainLabels(LABEL_TYPES.EVENT_TIMELINE);
    const { data: statusOptions = [] } = useDomainLabels(LABEL_TYPES.EVENT_STATUS);
    const { data: typeOptions = [] } = useDomainLabels(LABEL_TYPES.EVENT_TYPE);

    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
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
        if (!(title[DEFAULT_LANGUAGE] ?? '').trim()) return;

        const data: CreateEventRequest = {
            ...form,
            title,
            ...(Object.keys(subtitle).length ? { subtitle } : {}),
            ...(Object.keys(description).length ? { description } : {}),
        };

        if (isEditing && eventId) {
            const result = await handleUpdate(eventId, data);
            if (result) navigate(`${WEB_BASE_URL}${ROUTES.DASHBOARD_EVENTS}`);
        } else {
            const result = await handleCreate(data);
            if (result) navigate(`${WEB_BASE_URL}${ROUTES.DASHBOARD_EVENTS}`);
        }
    };

    const handleDeleteClick = async () => {
        if (!eventId || !confirm(t('dashboard.events.deleteConfirm'))) return;
        await handleDelete(eventId);
        navigate(`${WEB_BASE_URL}${ROUTES.DASHBOARD_EVENTS}`);
    };

    return {
        eventId,
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
    };
};

export default useEventFormState;
