import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getAdminNewsDetail } from '@feature/admin/service/adminNewsService';
import useAdminNewsActions from '@feature/admin/hook/useAdminNewsActions';
import type { CreateNewsRequest } from '@feature/admin/type/admin.types';

const CATEGORIES = [
    'PRINCIPAIS',
    'LANCAMENTOS',
    'ADAPTACOES',
    'INDUSTRIA',
    'ENTREVISTAS',
    'EVENTOS',
    'CURIOSIDADES',
    'MERCADO',
    'INTERNACIONAL',
];

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

    const [form, setForm] = useState<CreateNewsRequest>({
        title: '',
        category: 'PRINCIPAIS',
        subtitle: '',
        excerpt: '',
        coverImage: '',
        tags: [],
        authorName: '',
        source: '',
        readTime: 5,
        isExclusive: false,
        isFeatured: false,
    });

    const [tagsInput, setTagsInput] = useState('');

    useEffect(() => {
        if (existing) {
            setForm({
                title: existing.title,
                category: existing.category,
                subtitle: existing.subtitle ?? '',
                excerpt: existing.excerpt ?? '',
                coverImage: existing.coverImage ?? '',
                tags: existing.tags,
                authorName: existing.authorName ?? '',
                source: existing.source ?? '',
                readTime: existing.readTime,
                isExclusive: existing.isExclusive,
                isFeatured: existing.isFeatured,
            });
            setTagsInput(existing.tags.join(', '));
        }
    }, [existing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...form,
            tags: tagsInput
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean),
        };

        if (isEditing && newsId) {
            const result = await handleUpdate(newsId, data);
            if (result) navigate('/Manga-Reader/dashboard/news');
        } else {
            const result = await handleCreate(data);
            if (result) navigate('/Manga-Reader/dashboard/news');
        }
    };

    const handleDeleteClick = async () => {
        if (!newsId || !confirm(t('dashboard.news.deleteConfirm'))) return;
        await handleDelete(newsId);
        navigate('/Manga-Reader/dashboard/news');
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
                onClick={() => navigate('/Manga-Reader/dashboard/news')}
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">
                            {t('dashboard.news.form.title')} *
                        </span>
                        <input
                            required
                            value={form.title}
                            onChange={e =>
                                setForm(f => ({ ...f, title: e.target.value }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">
                            {t('dashboard.news.form.category')} *
                        </span>
                        <select
                            value={form.category}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    category: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-tertiary">
                        {t('dashboard.news.form.subtitle')}
                    </span>
                    <input
                        value={form.subtitle}
                        onChange={e =>
                            setForm(f => ({ ...f, subtitle: e.target.value }))
                        }
                        className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-tertiary">
                        {t('dashboard.news.form.excerpt')}
                    </span>
                    <textarea
                        rows={2}
                        value={form.excerpt}
                        onChange={e =>
                            setForm(f => ({ ...f, excerpt: e.target.value }))
                        }
                        className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">
                            {t('dashboard.news.form.cover')}
                        </span>
                        <input
                            value={form.coverImage}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    coverImage: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">
                            {t('dashboard.news.form.source')}
                        </span>
                        <input
                            value={form.source}
                            onChange={e =>
                                setForm(f => ({ ...f, source: e.target.value }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">
                            {t('dashboard.news.form.author')}
                        </span>
                        <input
                            value={form.authorName}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    authorName: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">
                            {t('dashboard.news.form.readTime')}
                        </span>
                        <input
                            type="number"
                            min={0}
                            value={form.readTime}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    readTime: Number(e.target.value),
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-tertiary">
                        {t('dashboard.news.form.tags')}
                    </span>
                    <input
                        value={tagsInput}
                        onChange={e => setTagsInput(e.target.value)}
                        placeholder={t('dashboard.news.form.tagsPlaceholder')}
                        className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </label>

                <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.isExclusive}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    isExclusive: e.target.checked,
                                }))
                            }
                        />
                        <span className="text-sm">
                            {t('dashboard.news.form.exclusive')}
                        </span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.isFeatured}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    isFeatured: e.target.checked,
                                }))
                            }
                        />
                        <span className="text-sm">
                            {t('dashboard.news.form.featured')}
                        </span>
                    </label>
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
