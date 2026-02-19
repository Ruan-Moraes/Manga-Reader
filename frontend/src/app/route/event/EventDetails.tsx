import { Link, useParams } from 'react-router-dom';
import {
    FiCalendar,
    FiClock,
    FiMapPin,
    FiNavigation,
    FiUsers,
} from 'react-icons/fi';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import { getEventById, getRelatedEvents, statusLabel } from '@feature/event';

// TODO: Refatorar esse componente, ele está muito grande e precisa ser dividido em subcomponentes menores para melhorar a legibilidade e manutenção. Talvez criar um componente específico para o leitor de capítulos, outro para a navegação entre capítulos e outro para os comentários.
const EventDetails = () => {
    const { eventId = '' } = useParams();

    const event = getEventById(eventId);

    if (!event) {
        return (
            <>
                <Header />
                <MainContent>
                    <p>Evento não encontrado.</p>
                    <Link
                        to="/Manga-Reader/events"
                        className="text-purple-400 underline"
                    >
                        Voltar para eventos
                    </Link>
                </MainContent>
                <Footer />
            </>
        );
    }

    const relatedEvents = getRelatedEvents(event);

    return (
        <>
            <Header />
            <MainContent>
                <article className="space-y-5">
                    <section className="overflow-hidden border rounded-2xl border-tertiary bg-secondary">
                        <img
                            src={event.image}
                            alt={event.title}
                            className="object-cover w-full h-72"
                        />
                        <div className="p-5 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full">
                                    {statusLabel[event.status]}
                                </span>
                                <span className="px-2 py-1 text-xs border rounded-full border-tertiary">
                                    {event.type}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold">
                                {event.title}
                            </h1>
                            <div className="flex items-center gap-3">
                                <img
                                    src={event.organizer.avatar}
                                    alt={event.organizer.name}
                                    className="object-cover w-10 h-10 rounded-full"
                                />
                                <Link
                                    to={event.organizer.profileLink}
                                    className="font-medium text-purple-400"
                                >
                                    {event.organizer.name}
                                </Link>
                            </div>
                        </div>
                    </section>
                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <div className="space-y-4 xl:col-span-2">
                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h2 className="text-xl font-semibold">
                                    Data e programação
                                </h2>
                                <p className="inline-flex items-center gap-2 text-sm text-tertiary">
                                    <FiClock /> Início:{' '}
                                    {new Date(event.startDate).toLocaleString(
                                        'pt-BR',
                                    )}
                                </p>
                                <p className="inline-flex items-center gap-2 ml-4 text-sm text-tertiary">
                                    <FiCalendar /> Término:{' '}
                                    {new Date(event.endDate).toLocaleString(
                                        'pt-BR',
                                    )}
                                </p>
                                <p className="text-sm text-tertiary">
                                    Fuso horário: {event.timezone}
                                </p>
                                <ul className="pl-5 text-sm list-disc">
                                    {event.schedule.map(item => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h2 className="text-xl font-semibold">
                                    Localização
                                </h2>
                                <p className="inline-flex items-center gap-2 text-sm">
                                    <FiMapPin /> {event.location.address} -{' '}
                                    {event.location.city}
                                </p>
                                <div className="p-4 text-sm border border-dashed rounded-lg border-tertiary">
                                    Mapa integrado (mock)
                                </div>
                                <div className="flex gap-3 text-sm">
                                    <a
                                        href={event.location.mapLink}
                                        className="text-purple-400 underline"
                                    >
                                        Abrir no Google Maps
                                    </a>
                                    <a
                                        href={event.location.mapLink}
                                        className="text-purple-400 underline"
                                    >
                                        Abrir no Waze
                                    </a>
                                </div>
                                <p className="text-sm text-tertiary">
                                    <FiNavigation className="inline mr-1" />
                                    {event.location.directions}
                                </p>
                            </div>

                            <div className="p-4 space-y-3 border rounded-xl border-tertiary bg-secondary">
                                <h2 className="text-xl font-semibold">
                                    Descrição
                                </h2>
                                <p>{event.description}</p>
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    {event.gallery.map(image => (
                                        <img
                                            key={image}
                                            src={image}
                                            alt="Galeria do evento"
                                            className="object-cover w-full rounded-lg h-36"
                                        />
                                    ))}
                                </div>
                                <p className="text-sm">
                                    <strong>Convidados:</strong>{' '}
                                    {event.specialGuests.join(', ')}
                                </p>
                            </div>

                            <div className="p-4 space-y-3 border rounded-xl border-tertiary bg-secondary">
                                <h2 className="text-xl font-semibold">
                                    Comentários e feed
                                </h2>
                                {event.comments.map(comment => (
                                    <div
                                        key={comment.id}
                                        className="p-3 text-sm rounded-lg bg-primary"
                                    >
                                        <p className="font-semibold">
                                            {comment.user}
                                        </p>
                                        <p>{comment.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <aside className="space-y-4">
                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h3 className="font-semibold">
                                    Ingressos e inscrição
                                </h3>
                                {event.tickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        className="p-2 text-sm rounded-lg bg-primary"
                                    >
                                        <p className="font-medium">
                                            {ticket.name}
                                        </p>
                                        <p>{ticket.price}</p>
                                        <p className="text-tertiary">
                                            Vagas: {ticket.available}
                                        </p>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="w-full py-2 mt-2 font-medium text-purple-900 bg-white rounded-lg"
                                >
                                    Fazer inscrição
                                </button>
                            </div>

                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h3 className="font-semibold">Organizador</h3>
                                <div className="flex items-center gap-2 text-sm">
                                    <img
                                        src={event.organizer.avatar}
                                        alt={event.organizer.name}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    {event.organizer.name}
                                </div>
                                <p className="text-sm text-tertiary">
                                    Contato: {event.organizer.contact}
                                </p>
                                <Link
                                    to="/Manga-Reader/events"
                                    className="text-sm text-purple-400 underline"
                                >
                                    Outros eventos do organizador
                                </Link>
                            </div>

                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h3 className="font-semibold">
                                    Eventos relacionados
                                </h3>
                                {relatedEvents.map(item => (
                                    <Link
                                        key={item.id}
                                        to={`/Manga-Reader/event/${item.id}`}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-primary"
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="object-cover w-12 h-12 rounded-lg"
                                        />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {item.title}
                                            </p>
                                            <p className="inline-flex items-center gap-1 text-xs text-tertiary">
                                                <FiUsers /> {item.participants}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </aside>
                    </section>
                </article>
            </MainContent>
            <Footer />
        </>
    );
};

export default EventDetails;
