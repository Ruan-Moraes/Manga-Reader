import { Link } from 'react-router-dom';
import { FiCalendar, FiFilter, FiPlus, FiStar } from 'react-icons/fi';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';
import BaseSelect from '@shared/component/input/BaseSelect';
import SearchInput from '@shared/component/input/SearchInput';
import {
    useEvents,
    useEventForm,
    eventTypes,
    EventCard,
    CreateEventForm,
    type EventType,
} from '@feature/event';

// TODO: Refatorar esse componente, ele está muito grande e precisa ser dividido em subcomponentes menores para melhorar a legibilidade e manutenção. Talvez criar um componente específico para o leitor de capítulos, outro para a navegação entre capítulos e outro para os comentários.
const Events = () => {
    const {
        tabs,
        isLoggedIn,
        hasCreatePermission,
        activeTab,
        setActiveTab,
        query,
        setQuery,
        type,
        setType,
        period,
        setPeriod,
        sort,
        setSort,
        events,
        featured,
    } = useEvents();

    const {
        showCreateForm,
        openForm,
        closeForm,
        draftEvent,
        updateDraftField,
        toggleDraft,
        handleSubmit,
    } = useEventForm();

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
                                onClick={openForm}
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
                        <SearchInput
                            value={query}
                            onChange={setQuery}
                            placeholder="Buscar por nome ou local"
                        />
                        <BaseSelect
                            options={[
                                { value: 'all', label: 'Todos os tipos' },
                                ...eventTypes.map(item => ({
                                    value: item,
                                    label: item,
                                })),
                            ]}
                            value={type}
                            onChange={event =>
                                setType(event.target.value as 'all' | EventType)
                            }
                            className="w-full p-2 text-sm border rounded-xs border-tertiary bg-secondary"
                        />
                        <BaseSelect
                            options={[
                                { value: 'all', label: 'Todas as datas' },
                                { value: 'today', label: 'Hoje' },
                                { value: 'week', label: 'Esta semana' },
                                { value: 'month', label: 'Este mês' },
                            ]}
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
                            className="w-full p-2 text-sm border rounded-xs border-tertiary bg-secondary"
                        />
                        <BaseSelect
                            options={[
                                { value: 'date', label: 'Ordenar por data' },
                                {
                                    value: 'popularity',
                                    label: 'Ordenar por popularidade',
                                },
                                {
                                    value: 'relevance',
                                    label: 'Ordenar por relevância',
                                },
                            ]}
                            value={sort}
                            onChange={event =>
                                setSort(
                                    event.target.value as
                                        | 'date'
                                        | 'popularity'
                                        | 'relevance',
                                )
                            }
                            className="w-full p-2 text-sm border rounded-xs border-tertiary bg-secondary"
                        />
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
                    <CreateEventForm
                        draftEvent={draftEvent}
                        updateDraftField={updateDraftField}
                        toggleDraft={toggleDraft}
                        onSubmit={handleSubmit}
                        onCancel={closeForm}
                    />
                )}
            </MainContent>
            <Footer />
        </>
    );
};

export default Events;
