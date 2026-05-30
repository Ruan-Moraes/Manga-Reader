import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { ArrowLeft } from 'lucide-react';

import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import { Input } from '@ui/Input';
import { Select } from '@ui/Select';
import { Checkbox } from '@ui/Checkbox';

import useEventFormState from '../hook/useEventFormState';

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
                onClick={() => navigate(`${WEB_BASE_URL}/dashboard/events`)}
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
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{`${t('dashboard.events.form.startDate')} *`}</span>
                        <Input
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
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{`${t('dashboard.events.form.endDate')} *`}</span>
                        <Input
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
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{`${t('dashboard.events.form.timeline')} *`}</span>
                        <Select
                            value={form.timeline}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    timeline: e.target.value,
                                }))
                            }
                            options={timelineOptions}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{`${t('dashboard.events.form.status')} *`}</span>
                        <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={statusOptions} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{`${t('dashboard.events.form.type')} *`}</span>
                        <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={typeOptions} />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.events.form.location')}</span>
                        <Input
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
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.events.form.city')}</span>
                        <Input
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
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.events.form.organizer')}</span>
                        <Input
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
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.events.form.price')}</span>
                        <Input
                            type="text"
                            placeholder={t('dashboard.events.form.pricePlaceholder')}
                            value={form.priceLabel ?? ''}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    priceLabel: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold">{t('dashboard.events.form.image')}</span>
                        <Input type="text" placeholder="" value={form.image ?? ''} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
                    </div>
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

export default AdminEventForm;
