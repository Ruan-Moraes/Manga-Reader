import { useState, useEffect } from 'react';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getAdminTitleDetail } from '@feature/admin/service/adminTitleService';
import useAdminTitleActions from '@feature/admin/hook/useAdminTitleActions';
import type { CreateTitleRequest } from '@feature/admin/type/admin.types';
import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import BaseInput from '@shared/component/input/BaseInput';
import BaseSelect from '@shared/component/input/BaseSelect';
import BaseCheckbox from '@shared/component/input/BaseCheckbox';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';
import { useDomainLabels, LABEL_TYPES } from '@feature/label';
import { useTagsFetch, TagSelectInput } from '@feature/category';
import type { Tag } from '@feature/category/type/tag.types';

type FormState = Omit<CreateTitleRequest, 'name' | 'synopsis'>;

const DashboardTitleForm = () => {
    const { t } = useTranslation('admin');
    const { titleId } = useParams<{ titleId: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(titleId);

    const { handleCreate, handleUpdate, handleDelete, isSubmitting } =
        useAdminTitleActions();

    const { data: existing, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_TITLE_DETAIL, titleId],
        queryFn: () => getAdminTitleDetail(titleId!),
        enabled: isEditing,
    });

    const { data: statusOptions = [] } = useDomainLabels(
        LABEL_TYPES.PUBLICATION_STATUS,
    );
    const { data: allTags = [] } = useTagsFetch();

    const [form, setForm] = useState<FormState>({
        type: 'manga',
        cover: '',
        genres: [],
        status: '',
        author: '',
        artist: '',
        publisher: '',
        adult: false,
    });

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
                .map(g =>
                    allTags.find(
                        t => t.label.toLowerCase() === g.toLowerCase(),
                    ),
                )
                .filter((t): t is Tag => t !== undefined);
            setSelectedTags(matched);
            setName(existing.name ?? {});
            setSynopsis(existing.synopsis ?? {});
        }
    }, [existing, allTags]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ptName = (name[DEFAULT_LANGUAGE] ?? '').trim();
        if (!ptName) return;

        const data: CreateTitleRequest = {
            ...form,
            name,
            ...(Object.keys(synopsis).length ? { synopsis } : {}),
            genres: selectedTags.map(t => t.label),
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
                onClick={() => navigate(`${WEB_BASE_URL}/dashboard/titles`)}
                className="flex items-center gap-1 text-sm w-fit hover:text-quaternary-default"
            >
                <FiArrowLeft size={14} />
                {t('common.back')}
            </button>

            <h1 className="text-lg font-bold">
                {isEditing
                    ? t('dashboard.titles.editTitle')
                    : t('dashboard.titles.newTitle')}
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <LocalizedTextInput
                    label={t('dashboard.titles.form.name')}
                    value={name}
                    onChange={setName}
                    maxLength={200}
                />

                <BaseSelect
                    label={t('dashboard.titles.form.type')}
                    variant="outlined"
                    value={form.type}
                    onChange={e =>
                        setForm(f => ({ ...f, type: e.target.value }))
                    }
                    options={[
                        {
                            value: 'manga',
                            label: t('dashboard.titles.form.typeManga'),
                        },
                        {
                            value: 'manhwa',
                            label: t('dashboard.titles.form.typeManhwa'),
                        },
                        {
                            value: 'manhua',
                            label: t('dashboard.titles.form.typeManhua'),
                        },
                    ]}
                />

                <LocalizedTextInput
                    label={t('dashboard.titles.form.synopsis')}
                    value={synopsis}
                    onChange={setSynopsis}
                    multiline
                    rows={4}
                    requiredLanguages={[]}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <BaseInput
                        label={t('dashboard.titles.form.cover')}
                        variant="outlined"
                        type="text"
                        placeholder=""
                        value={form.cover ?? ''}
                        onChange={e =>
                            setForm(f => ({ ...f, cover: e.target.value }))
                        }
                    />
                    <BaseSelect
                        label={t('dashboard.titles.form.status')}
                        variant="outlined"
                        value={form.status ?? ''}
                        onChange={e =>
                            setForm(f => ({ ...f, status: e.target.value }))
                        }
                        options={statusOptions}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">
                        {t('dashboard.titles.form.genres')}
                    </span>
                    <TagSelectInput
                        options={allTags}
                        onChange={setSelectedTags}
                        placeholder={t(
                            'dashboard.titles.form.genresPlaceholder',
                        )}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <BaseInput
                        label={t('dashboard.titles.form.author')}
                        variant="outlined"
                        type="text"
                        placeholder=""
                        value={form.author ?? ''}
                        onChange={e =>
                            setForm(f => ({ ...f, author: e.target.value }))
                        }
                    />
                    <BaseInput
                        label={t('dashboard.titles.form.artist')}
                        variant="outlined"
                        type="text"
                        placeholder=""
                        value={form.artist ?? ''}
                        onChange={e =>
                            setForm(f => ({ ...f, artist: e.target.value }))
                        }
                    />
                    <BaseInput
                        label={t('dashboard.titles.form.publisher')}
                        variant="outlined"
                        type="text"
                        placeholder=""
                        value={form.publisher ?? ''}
                        onChange={e =>
                            setForm(f => ({ ...f, publisher: e.target.value }))
                        }
                    />
                </div>

                <BaseCheckbox
                    label={t('dashboard.titles.form.adult')}
                    checked={form.adult}
                    onChange={checked =>
                        setForm(f => ({ ...f, adult: checked }))
                    }
                />

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

export default DashboardTitleForm;
