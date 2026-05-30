import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { ROUTES } from '@shared/constant/ROUTES';
import { ArrowLeft } from 'lucide-react';

import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import { Input } from '@ui/Input';
import { Select } from '@ui/Select';
import { Checkbox } from '@ui/Checkbox';

import useNewsFormState from '../model/useNewsFormState';

const AdminNewsForm = () => {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();

    const {
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
    } = useNewsFormState();

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
                onClick={() => navigate(`${WEB_BASE_URL}${ROUTES.DASHBOARD_NEWS}`)}
                className="flex items-center gap-1 text-sm w-fit hover:text-quaternary-default"
            >
                <ArrowLeft size={14} />
                {t('common.back')}
            </button>
            <h1 className="text-lg font-bold">{isEditing ? t('dashboard.news.editTitle') : t('dashboard.news.newTitle')}</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <LocalizedTextInput label={t('dashboard.news.form.title')} value={title} onChange={setTitle} maxLength={300} />

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{`${t('dashboard.news.form.category')} *`}</span>
                    <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={categoryOptions} />
                </div>

                <LocalizedTextInput label={t('dashboard.news.form.subtitle')} value={subtitle} onChange={setSubtitle} requiredLanguages={[]} maxLength={500} />
                <LocalizedTextInput label={t('dashboard.news.form.excerpt')} value={excerpt} onChange={setExcerpt} multiline rows={3} requiredLanguages={[]} />

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.news.form.cover')}</span>
                        <Input
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
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.news.form.source')}</span>
                        <Input type="text" placeholder="" value={form.source ?? ''} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.news.form.author')}</span>
                        <Input
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
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.news.form.readTime')}</span>
                        <Input
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
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('dashboard.news.form.tags')}</span>
                    <Input type="text" placeholder={t('dashboard.news.form.tagsPlaceholder')} value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
                </div>

                <div className="flex flex-wrap gap-4">
                    <Checkbox
                        label={t('dashboard.news.form.exclusive')}
                        checked={form.isExclusive}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                isExclusive: e.target.checked,
                            }))
                        }
                    />
                    <Checkbox
                        label={t('dashboard.news.form.featured')}
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

export default AdminNewsForm;
