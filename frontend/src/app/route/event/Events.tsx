import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiCalendar,
    FiClock,
    FiFilter,
    FiMapPin,
    FiPlus,
    FiSearch,
    FiShare2,
    FiStar,
    FiUsers,
} from 'react-icons/fi';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';
import { useAuth } from '@feature/auth';
import {
    eventTypes,
    filterEvents,
    statusLabel,
    type EventType,
    type EventData,
} from '@feature/event';

const tabs = [
    { id: 'upcoming', label: 'Próximos Eventos' },
    { id: 'ongoing', label: 'Eventos em Andamento' },
    { id: 'past', label: 'Eventos Passados' },
    { id: 'my-events', label: 'Meus Eventos' },
] as const;

const formatDate = (date: string) =>
    new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));

const Events = () => {
    const { isLoggedIn, user } = useAuth();
    const hasCreatePermission = Boolean(
        user?.moderator?.isModerator || user?.member?.isMember,
    );

    const [activeTab, setActiveTab] =
        useState<(typeof tabs)[number]['id']>('upcoming');
    const [query, setQuery] = useState('');
    const [type, setType] = useState<'all' | EventType>('all');
    const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>(
        'all',
    );
    const [sort, setSort] = useState<'date' | 'popularity' | 'relevance'>(
        'date',
    );
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [draftEvent, setDraftEvent] = useState({
        title: '',
        type: 'Convenção' as EventType,
        startDate: '',
        endDate: '',
        location: '',
        description: '',
        image: '',
        ticketPrice: '',
        website: '',
        instagram: '',
        contact: '',
        maxParticipants: '',
        privacy: 'public',
        approvalRequired: false,
        asDraft: false,
    });

    const events = useMemo(
        () =>
            filterEvents({
                tab: activeTab,
                query,
                type,
                period,
                sort,
                isLoggedIn,
            }),
        [activeTab, isLoggedIn, period, query, sort, type],
    );

    const featured = events.find(event => event.isFeatured) ?? events[0];

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setShowCreateForm(false);
    };

    return (
        <>
            <Header />
            <MainContent>
                <section className="p-4 border bg-secondary border-tertiary rounded-2xl">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="flex items-center gap-2 text-3xl font-bold">
                                <FiCalendar className="text-purple-400" />{' '}
                                Eventos
                            </h2>
                            <p className="mt-2 text-sm text-tertiary">
                                Fique por dentro dos principais eventos do mundo
                                dos mangás, convenções, lançamentos e atividades
                                da comunidade.
                            </p>
                        </div>
                        {hasCreatePermission && (
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-500"
                            >
                                <FiPlus /> Criar Evento
                            </button>
                        )}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                disabled={tab.id === 'my-events' && !isLoggedIn}
                                className={`rounded-full px-4 py-2 text-sm transition ${
                                    activeTab === tab.id
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-secondary text-primary border border-tertiary'
                                } disabled:opacity-50`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <label className="relative">
                            <FiSearch className="absolute -translate-y-1/2 left-3 top-1/2 text-tertiary" />
                            <input
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                                placeholder="Buscar por nome ou local"
                                className="w-full py-2 pl-10 pr-3 border rounded-lg border-tertiary bg-secondary"
                            />
                        </label>

                        <select
                            value={type}
                            onChange={event =>
                                setType(event.target.value as 'all' | EventType)
                            }
                            className="p-2 border rounded-lg border-tertiary bg-secondary"
                        >
                            <option value="all">Todos os tipos</option>
                            {eventTypes.map(item => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>

                        <select
                            value={period}
                            onChange={event =>
                                setPeriod(
                                    event.target.value as
                                        | 'all'
                                        | 'today'
                                        | 'week'
                                        | 'month',
                                )
                            }
                            className="p-2 border rounded-lg border-tertiary bg-secondary"
                        >
                            <option value="all">Todas as datas</option>
                            <option value="today">Hoje</option>
                            <option value="week">Esta semana</option>
                            <option value="month">Este mês</option>
                        </select>

                        <select
                            value={sort}
                            onChange={event =>
                                setSort(
                                    event.target.value as
                                        | 'date'
                                        | 'popularity'
                                        | 'relevance',
                                )
                            }
                            className="p-2 border rounded-lg border-tertiary bg-secondary"
                        >
                            <option value="date">Ordenar por data</option>
                            <option value="popularity">
                                Ordenar por popularidade
                            </option>
                            <option value="relevance">
                                Ordenar por relevância
                            </option>
                        </select>
                    </div>
                </section>

                {featured && (
                    <section className="relative overflow-hidden border border-purple-500/40 rounded-2xl">
                        <img
                            src={featured.image}
                            alt={featured.title}
                            className="object-cover w-full h-64 opacity-45"
                        />
                        <div className="absolute inset-0 p-5 bg-gradient-to-t from-black/75 to-black/20">
                            <span className="inline-flex items-center gap-1 px-3 py-1 mb-3 text-xs font-semibold text-white bg-purple-600 rounded-full">
                                <FiStar /> Evento destaque
                            </span>
                            <h3 className="text-2xl font-bold text-white">
                                {featured.title}
                            </h3>
                            <p className="mb-3 text-sm text-white/90">
                                {featured.subtitle}
                            </p>
                            <Link
                                to={`/Manga-Reader/event/${featured.id}`}
                                className="inline-flex px-4 py-2 text-sm font-medium text-purple-900 bg-white rounded-lg"
                            >
                                Ver detalhes
                            </Link>
                        </div>
                    </section>
                )}

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {events.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </section>

                {!events.length && (
                    <div className="p-6 text-center border rounded-lg border-tertiary bg-secondary">
                        <FiFilter className="mx-auto mb-2 text-2xl text-tertiary" />
                        <p>Nenhum evento encontrado com os filtros atuais.</p>
                    </div>
                )}

                {showCreateForm && (
                    <section className="p-5 space-y-4 border rounded-2xl bg-secondary border-tertiary">
                        <h3 className="text-xl font-semibold">
                            Criar / Editar Evento
                        </h3>
                        <form
                            className="grid grid-cols-1 gap-3 lg:grid-cols-2"
                            onSubmit={handleSubmit}
                        >
                            <input
                                required
                                placeholder="Título do evento"
                                value={draftEvent.title}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        title: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            />
                            <select
                                value={draftEvent.type}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        type: event.target.value as EventType,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            >
                                {eventTypes.map(item => (
                                    <option key={item}>{item}</option>
                                ))}
                            </select>
                            <input
                                required
                                type="datetime-local"
                                min={new Date().toISOString().slice(0, 16)}
                                value={draftEvent.startDate}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        startDate: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            />
                            <input
                                required
                                type="datetime-local"
                                min={
                                    draftEvent.startDate ||
                                    new Date().toISOString().slice(0, 16)
                                }
                                value={draftEvent.endDate}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        endDate: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            />
                            <input
                                required
                                placeholder="Local físico ou link online"
                                value={draftEvent.location}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        location: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            />
                            <input
                                placeholder="URL da imagem de capa (mock upload + crop)"
                                value={draftEvent.image}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        image: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            />
                            <textarea
                                required
                                placeholder="Descrição do evento (rich text simplificado)"
                                value={draftEvent.description}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        description: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary lg:col-span-2"
                                rows={4}
                            />
                            <input
                                placeholder="Preço/ingresso"
                                value={draftEvent.ticketPrice}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        ticketPrice: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            />
                            <input
                                placeholder="Site oficial"
                                value={draftEvent.website}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        website: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            />
                            <input
                                placeholder="Instagram / Twitter"
                                value={draftEvent.instagram}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        instagram: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            />
                            <input
                                placeholder="Contato do organizador"
                                value={draftEvent.contact}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        contact: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            />
                            <input
                                placeholder="Máximo de participantes"
                                value={draftEvent.maxParticipants}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        maxParticipants: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            />
                            <select
                                value={draftEvent.privacy}
                                onChange={event =>
                                    setDraftEvent(prev => ({
                                        ...prev,
                                        privacy: event.target.value,
                                    }))
                                }
                                className="p-2 border rounded-lg border-tertiary bg-primary"
                            >
                                <option value="public">Público</option>
                                <option value="members">
                                    Restrito a membros
                                </option>
                            </select>
                            <label className="flex items-center gap-2 text-sm lg:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={draftEvent.approvalRequired}
                                    onChange={event =>
                                        setDraftEvent(prev => ({
                                            ...prev,
                                            approvalRequired:
                                                event.target.checked,
                                        }))
                                    }
                                />
                                Exigir aprovação para participar
                            </label>
                            <div className="flex flex-wrap gap-2 lg:col-span-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-purple-600 rounded-lg"
                                >
                                    Publicar evento
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDraftEvent(prev => ({
                                            ...prev,
                                            asDraft: !prev.asDraft,
                                        }))
                                    }
                                    className="px-4 py-2 border rounded-lg border-tertiary"
                                >
                                    {draftEvent.asDraft
                                        ? 'Rascunho salvo'
                                        : 'Salvar como rascunho'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-4 py-2 border rounded-lg border-tertiary"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                        <div className="p-4 text-sm border rounded-lg border-tertiary bg-primary">
                            <p className="mb-2 font-semibold">
                                Preview em tempo real
                            </p>
                            <p className="font-medium">
                                {draftEvent.title || 'Título do evento'}
                            </p>
                            <p>
                                {draftEvent.description ||
                                    'Descrição aparecerá aqui.'}
                            </p>
                            <p className="mt-1 text-tertiary">
                                {draftEvent.startDate
                                    ? `Início: ${new Date(draftEvent.startDate).toLocaleString('pt-BR')}`
                                    : 'Defina data e hora'}
                            </p>
                        </div>
                    </section>
                )}
            </MainContent>
            <Footer />
        </>
    );
};

const EventCard = ({ event }: { event: EventData }) => (
    <Link
        to={`/Manga-Reader/event/${event.id}`}
        className="overflow-hidden transition border group rounded-2xl border-tertiary bg-secondary hover:-translate-y-1 hover:shadow-xl hover:border-purple-400/70"
    >
        <img
            src={event.image}
            alt={event.title}
            className="object-cover w-full h-44"
        />
        <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full">
                    {statusLabel[event.status]}
                </span>
                <button
                    type="button"
                    className="p-2 border rounded-full border-tertiary"
                    onClick={eventClick => eventClick.preventDefault()}
                >
                    <FiShare2 />
                </button>
            </div>
            <h3 className="text-lg font-bold">{event.title}</h3>
            <div className="space-y-1 text-sm text-tertiary">
                <p className="flex items-center gap-2">
                    <FiClock /> {formatDate(event.startDate)}
                </p>
                <p className="flex items-center gap-2">
                    <FiMapPin /> {event.location.label}
                </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 border rounded-full border-tertiary">
                    {event.type}
                </span>
                <span className="px-2 py-1 border rounded-full border-tertiary">
                    {event.priceLabel}
                </span>
            </div>
            <p className="text-sm">
                Organizador:{' '}
                <span className="font-medium text-purple-400">
                    {event.organizer.name}
                </span>
            </p>
            <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1">
                    <FiUsers /> {event.participants} participantes
                </span>
                <span className="inline-flex items-center gap-1">
                    <FiCalendar /> Salvar
                </span>
            </div>
            <button
                type="button"
                onClick={eventClick => eventClick.preventDefault()}
                className="w-full px-3 py-2 mt-1 text-sm font-semibold text-purple-900 transition bg-white rounded-lg group-hover:bg-purple-200"
            >
                {event.amIParticipating ? 'Confirmado' : 'Tenho Interesse'}
            </button>
        </div>
    </Link>
);

export default Events;
