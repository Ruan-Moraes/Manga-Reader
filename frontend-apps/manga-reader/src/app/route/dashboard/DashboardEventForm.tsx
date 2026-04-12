import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getAdminEventDetail } from '@feature/admin/service/adminEventService';
import useAdminEventActions from '@feature/admin/hook/useAdminEventActions';
import type { CreateEventRequest } from '@feature/admin/type/admin.types';

const TIMELINES = ['UPCOMING', 'ONGOING', 'PAST'];
const STATUSES = [
    'HAPPENING_NOW',
    'REGISTRATIONS_OPEN',
    'COMING_SOON',
    'ENDED',
];
const TYPES = ['CONVENCAO', 'LANCAMENTO', 'LIVE', 'WORKSHOP', 'MEETUP'];

const DashboardEventForm = () => {
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

    const [form, setForm] = useState<CreateEventRequest>({
        title: '',
        startDate: '',
        endDate: '',
        timeline: 'UPCOMING',
        status: 'COMING_SOON',
        type: 'CONVENCAO',
        subtitle: '',
        description: '',
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

    useEffect(() => {
        if (existing) {
            setForm({
                title: existing.title,
                startDate: existing.startDate.slice(0, 16),
                endDate: existing.endDate.slice(0, 16),
                timeline: existing.timeline,
                status: existing.status,
                type: existing.type,
                subtitle: existing.subtitle ?? '',
                description: existing.description ?? '',
                image: existing.image ?? '',
                timezone: existing.timezone ?? 'America/Sao_Paulo',
                locationLabel: existing.locationLabel ?? '',
                locationCity: existing.locationCity ?? '',
                locationIsOnline: existing.locationIsOnline,
                organizerName: existing.organizerName ?? '',
                priceLabel: existing.priceLabel ?? '',
                isFeatured: existing.isFeatured,
            });
        }
    }, [existing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && eventId) {
            const result = await handleUpdate(eventId, form);
            if (result) navigate('/Manga-Reader/dashboard/events');
        } else {
            const result = await handleCreate(form);
            if (result) navigate('/Manga-Reader/dashboard/events');
        }
    };

    const handleDeleteClick = async () => {
        if (!eventId || !confirm('Tem certeza que deseja excluir este evento?'))
            return;
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
                Voltar para lista
            </button>

            <h1 className="text-lg font-bold">
                {isEditing ? 'Editar Evento' : 'Novo Evento'}
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Titulo *</span>
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
                        <span className="text-sm text-tertiary">Subtitulo</span>
                        <input
                            value={form.subtitle}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    subtitle: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-tertiary">Descricao</span>
                    <textarea
                        rows={3}
                        value={form.description}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                description: e.target.value,
                            }))
                        }
                        className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">
                            Data inicio *
                        </span>
                        <input
                            type="datetime-local"
                            required
                            value={form.startDate}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    startDate: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">
                            Data fim *
                        </span>
                        <input
                            type="datetime-local"
                            required
                            value={form.endDate}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    endDate: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">
                            Timeline *
                        </span>
                        <select
                            value={form.timeline}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    timeline: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        >
                            {TIMELINES.map(t => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Status *</span>
                        <select
                            value={form.status}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    status: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        >
                            {STATUSES.map(s => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Tipo *</span>
                        <select
                            value={form.type}
                            onChange={e =>
                                setForm(f => ({ ...f, type: e.target.value }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        >
                            {TYPES.map(t => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Local</span>
                        <input
                            value={form.locationLabel}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    locationLabel: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Cidade</span>
                        <input
                            value={form.locationCity}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    locationCity: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">
                            Organizador
                        </span>
                        <input
                            value={form.organizerName}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    organizerName: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Preco</span>
                        <input
                            value={form.priceLabel}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    priceLabel: e.target.value,
                                }))
                            }
                            placeholder="R$ 50,00"
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">
                            Imagem URL
                        </span>
                        <input
                            value={form.image}
                            onChange={e =>
                                setForm(f => ({ ...f, image: e.target.value }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                </div>

                <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.locationIsOnline}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    locationIsOnline: e.target.checked,
                                }))
                            }
                        />
                        <span className="text-sm">Online</span>
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
                        <span className="text-sm">Destaque</span>
                    </label>
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-dark disabled:opacity-50"
                    >
                        {isSubmitting
                            ? 'Salvando...'
                            : isEditing
                              ? 'Salvar'
                              : 'Criar'}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-semibold text-red-300 border rounded-xs border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"
                        >
                            Excluir
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default DashboardEventForm;
