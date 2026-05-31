import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { ArrowLeft } from 'lucide-react';

import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import { Input } from '@ui/Input';
import { Select } from '@ui/Select';
import { Checkbox } from '@ui/Checkbox';
import { TagSelectInput } from '@entities/catalog-filter';

import useTitleFormState from '../model/useTitleFormState';

const AdminTitleForm = () => {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();

    const {
        isEditing,
        isLoading,
        isSubmitting,
        form,
        setForm,
        setSelectedTags,
        name,
        setName,
        synopsis,
        setSynopsis,
        allTags,
        statusOptions,
        handleSubmit,
        handleDeleteClick,
    } = useTitleFormState();

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
                <ArrowLeft size={14} />
                {t('common.back')}
            </button>
            <h1 className="text-lg font-bold">{isEditing ? t('dashboard.titles.editTitle') : t('dashboard.titles.newTitle')}</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <LocalizedTextInput label={t('dashboard.titles.form.name')} value={name} onChange={setName} maxLength={200} />

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('dashboard.titles.form.type')}</span>
                    <Select
                        value={form.type}
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
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
                </div>

                <LocalizedTextInput
                    label={t('dashboard.titles.form.synopsis')}
                    value={synopsis}
                    onChange={setSynopsis}
                    multiline
                    rows={4}
                    requiredLanguages={[]}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.titles.form.cover')}</span>
                        <Input type="text" placeholder="" value={form.cover ?? ''} onChange={e => setForm(f => ({ ...f, cover: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.titles.form.status')}</span>
                        <Select value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={statusOptions} />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">{t('dashboard.titles.form.genres')}</span>
                    <TagSelectInput options={allTags} onChange={setSelectedTags} placeholder={t('dashboard.titles.form.genresPlaceholder')} />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.titles.form.author')}</span>
                        <Input type="text" placeholder="" value={form.author ?? ''} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.titles.form.artist')}</span>
                        <Input type="text" placeholder="" value={form.artist ?? ''} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.titles.form.publisher')}</span>
                        <Input
                            type="text"
                            placeholder=""
                            value={form.publisher ?? ''}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    publisher: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>

                <Checkbox label={t('dashboard.titles.form.adult')} checked={form.adult} onChange={e => setForm(f => ({ ...f, adult: e.target.checked }))} />

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

export default AdminTitleForm;
