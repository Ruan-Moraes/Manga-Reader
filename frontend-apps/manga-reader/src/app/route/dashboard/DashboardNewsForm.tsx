import { useState, useEffect } from 'react';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

import { useDomainLabels, LABEL_TYPES } from '@feature/label';
import { getAdminNewsDetail } from '@feature/admin/service/adminNewsService';
import useAdminNewsActions from '@feature/admin/hook/useAdminNewsActions';
import type { CreateNewsRequest } from '@feature/admin/type/admin.types';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import BaseInput from '@shared/component/input/BaseInput';
import BaseSelect from '@shared/component/input/BaseSelect';
import BaseCheckbox from '@shared/component/input/BaseCheckbox';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';

type FormState = Omit<
    CreateNewsRequest,
    'title' | 'subtitle' | 'excerpt' | 'content'
>;

const DashboardNewsForm = () => {
    const { t } = useTranslation('admin');

    const { newsId } = useParams<{ newsId: string }>();

    const navigate = useNavigate();

    const isEditing = Boolean(newsId);

    const { handleCreate, handleUpdate, handleDelete, isSubmitting } =
        useAdminNewsActions();

    const { data: existing, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_NEWS_DETAIL, newsId],
        queryFn: () => getAdminNewsDetail(newsId!),
        enabled: isEditing,
    });

    const { data: categoryOptions = [] } = useDomainLabels(
        LABEL_TYPES.NEWS_CATEGORY,
    );

    const [form, setForm] = useState<FormState>({
        category: 'PRINCIPAIS',
        coverImage: '',
        tags: [],
        authorName: '',
        source: '',
        readTime: 5,
        isExclusive: false,
        isFeatured: false,
    });

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

        const ptTitle = (title[DEFAULT_LANGUAGE] ?? '').trim();

        if (!ptTitle) return;

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
                onClick={() => navigate(`${WEB_BASE_URL}/dashboard/news`)}
                className="flex items-center gap-1 text-sm w-fit hover:text-quaternary-default"
            >
                <FiArrowLeft size={14} />
                {t('common.back')}
            </button>

            <h1 className="text-lg font-bold">
                {isEditing
                    ? t('dashboard.news.editTitle')
                    : t('dashboard.news.newTitle')}
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <LocalizedTextInput
                    label={t('dashboard.news.form.title')}
                    value={title}
                    onChange={setTitle}
                    maxLength={300}
                />

                <BaseSelect
                    label={`${t('dashboard.news.form.category')} *`}
                    variant="outlined"
                    value={form.category}
                    onChange={e =>
                        setForm(f => ({ ...f, category: e.target.value }))
                    }
                    options={categoryOptions}
                />

                <LocalizedTextInput
                    label={t('dashboard.news.form.subtitle')}
                    value={subtitle}
                    onChange={setSubtitle}
                    requiredLanguages={[]}
                    maxLength={500}
                />

                <LocalizedTextInput
                    label={t('dashboard.news.form.excerpt')}
                    value={excerpt}
                    onChange={setExcerpt}
                    multiline
                    rows={3}
                    requiredLanguages={[]}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <BaseInput
                        label={t('dashboard.news.form.cover')}
                        variant="outlined"
                        type="text"
                        placeholder=""
                        value={form.coverImage ?? ''}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                coverImage: e.target.value,
                            }))
                        }
                    />
                    <BaseInput
                        label={t('dashboard.news.form.source')}
                        variant="outlined"
                        type="text"
                        placeholder=""
                        value={form.source ?? ''}
                        onChange={e =>
                            setForm(f => ({ ...f, source: e.target.value }))
                        }
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <BaseInput
                        label={t('dashboard.news.form.author')}
                        variant="outlined"
                        type="text"
                        placeholder=""
                        value={form.authorName ?? ''}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                authorName: e.target.value,
                            }))
                        }
                    />
                    <BaseInput
                        label={t('dashboard.news.form.readTime')}
                        variant="outlined"
                        type="number"
                        min={0}
                        placeholder=""
                        value={String(form.readTime)}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                readTime: Number(e.target.value),
                            }))
                        }
                    />
                </div>

                <BaseInput
                    label={t('dashboard.news.form.tags')}
                    variant="outlined"
                    type="text"
                    placeholder={t('dashboard.news.form.tagsPlaceholder')}
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                />

                <div className="flex flex-wrap gap-4">
                    <BaseCheckbox
                        label={t('dashboard.news.form.exclusive')}
                        checked={form.isExclusive}
                        onChange={checked =>
                            setForm(f => ({ ...f, isExclusive: checked }))
                        }
                    />
                    <BaseCheckbox
                        label={t('dashboard.news.form.featured')}
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

export default DashboardNewsForm;
