import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getAdminTitleDetail } from '../api/adminTitleService';
import useAdminTitleActions from './useAdminTitleActions';
import type { CreateTitleRequest } from '../model/admin.types';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';
import { useDomainLabels, LABEL_TYPES } from '@entities/label';
import { useTagsFetch, type Tag } from '@entities/category';

type FormState = Omit<CreateTitleRequest, 'name' | 'synopsis'>;

const DEFAULT_FORM: FormState = {
    type: 'manga',
    cover: '',
    genres: [],
    status: '',
    author: '',
    artist: '',
    publisher: '',
    adult: false,
};

const useTitleFormState = () => {
    const { t } = useTranslation('admin');
    const { titleId } = useParams<{ titleId: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(titleId);

    const { handleCreate, handleUpdate, handleDelete, isSubmitting } = useAdminTitleActions();

    const { data: existing, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_TITLE_DETAIL, titleId],
        queryFn: () => getAdminTitleDetail(titleId!),
        enabled: isEditing,
    });

    const { data: statusOptions = [] } = useDomainLabels(LABEL_TYPES.PUBLICATION_STATUS);
    const { data: allTags = [] } = useTagsFetch();

    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [name, setName] = useState<LocalizedString>({});
    const [synopsis, setSynopsis] = useState<LocalizedString>({});

    useEffect(() => {
        if (existing) {
            setForm({
                type: existing.type,
                cover: existing.cover ?? '',
                genres: existing.genres,
                status: existing.status ?? '',
                author: existing.author ?? '',
                artist: existing.artist ?? '',
                publisher: existing.publisher ?? '',
                adult: existing.adult,
            });
            const matched = existing.genres
                .map(g => allTags.find(tag => tag.label.toLowerCase() === g.toLowerCase()))
                .filter((tag): tag is Tag => tag !== undefined);
            setSelectedTags(matched);
            setName(existing.name ?? {});
            setSynopsis(existing.synopsis ?? {});
        }
    }, [existing, allTags]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!(name[DEFAULT_LANGUAGE] ?? '').trim()) return;

        const data: CreateTitleRequest = {
            ...form,
            name,
            ...(Object.keys(synopsis).length ? { synopsis } : {}),
            genres: selectedTags.map(tag => tag.label),
        };

        if (isEditing && titleId) {
            const result = await handleUpdate(titleId, data);
            if (result) navigate(`${WEB_BASE_URL}/dashboard/titles`);
        } else {
            const result = await handleCreate(data);
            if (result) navigate(`${WEB_BASE_URL}/dashboard/titles`);
        }
    };

    const handleDeleteClick = async () => {
        if (!titleId || !confirm(t('dashboard.titles.deleteConfirm'))) return;
        await handleDelete(titleId);
        navigate(`${WEB_BASE_URL}/dashboard/titles`);
    };

    return {
        titleId,
        isEditing,
        isLoading,
        isSubmitting,
        form,
        setForm,
        selectedTags,
        setSelectedTags,
        name,
        setName,
        synopsis,
        setSynopsis,
        allTags,
        statusOptions,
        handleSubmit,
        handleDeleteClick,
    };
};

export default useTitleFormState;
