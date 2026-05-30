import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getAdminNewsDetail } from '../service/adminNewsService';
import useAdminNewsActions from './useAdminNewsActions';
import type { CreateNewsRequest } from '../type/admin.types';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';
import { useDomainLabels, LABEL_TYPES } from '@entities/label';
import type { NewsCategory } from '@entities/news';

type FormState = Omit<CreateNewsRequest, 'title' | 'subtitle' | 'excerpt' | 'content'> & { category: NewsCategory };

const DEFAULT_FORM: FormState = {
    category: 'Principais',
    coverImage: '',
    tags: [],
    authorName: '',
    source: '',
    readTime: 5,
    isExclusive: false,
    isFeatured: false,
};

const useNewsFormState = () => {
    const { t } = useTranslation('admin');
    const { newsId } = useParams<{ newsId: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(newsId);

    const { handleCreate, handleUpdate, handleDelete, isSubmitting } = useAdminNewsActions();

    const { data: existing, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_NEWS_DETAIL, newsId],
        queryFn: () => getAdminNewsDetail(newsId!),
        enabled: isEditing,
    });

    const { data: categoryOptions = [] } = useDomainLabels(LABEL_TYPES.NEWS_CATEGORY);

    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [tagsInput, setTagsInput] = useState('');
    const [title, setTitle] = useState<LocalizedString>({});
    const [subtitle, setSubtitle] = useState<LocalizedString>({});
    const [excerpt, setExcerpt] = useState<LocalizedString>({});

    useEffect(() => {
        if (existing) {
            setForm({
                category: existing.category,
                coverImage: existing.coverImage ?? '',
                tags: existing.tags,
                authorName: existing.authorName ?? '',
                source: existing.source ?? '',
                readTime: existing.readTime,
                isExclusive: existing.isExclusive,
                isFeatured: existing.isFeatured,
            });
            setTagsInput(existing.tags.join(', '));
            setTitle(existing.title ?? {});
            setSubtitle(existing.subtitle ?? {});
            setExcerpt(existing.excerpt ?? {});
        }
    }, [existing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!(title[DEFAULT_LANGUAGE] ?? '').trim()) return;

        const data: CreateNewsRequest = {
            ...form,
            title,
            ...(Object.keys(subtitle).length ? { subtitle } : {}),
            ...(Object.keys(excerpt).length ? { excerpt } : {}),
            tags: tagsInput
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean),
        };

        if (isEditing && newsId) {
            const result = await handleUpdate(newsId, data);
            if (result) navigate(`${WEB_BASE_URL}/dashboard/news`);
        } else {
            const result = await handleCreate(data);
            if (result) navigate(`${WEB_BASE_URL}/dashboard/news`);
        }
    };

    const handleDeleteClick = async () => {
        if (!newsId || !confirm(t('dashboard.news.deleteConfirm'))) return;
        await handleDelete(newsId);
        navigate(`${WEB_BASE_URL}/dashboard/news`);
    };

    return {
        newsId,
        isEditing,
        isLoading,
        isSubmitting,
        form,
        setForm,
        tagsInput,
        setTagsInput,
        title,
        setTitle,
        subtitle,
        setSubtitle,
        excerpt,
        setExcerpt,
        categoryOptions,
        handleSubmit,
        handleDeleteClick,
    };
};

export default useNewsFormState;
