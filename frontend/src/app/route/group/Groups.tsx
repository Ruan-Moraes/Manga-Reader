import { useState } from 'react';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import { GroupCard, useGroups, type GroupStatus } from '@feature/group';

// TODO: Refatorar esse componente, ele está muito grande e precisa ser dividido em subcomponentes menores para melhorar a legibilidade e manutenção. Talvez criar um componente específico para o leitor de capítulos, outro para a navegação entre capítulos e outro para os comentários.
const Groups = () => {
    const [status, setStatus] = useState<'all' | GroupStatus>('all');
    const [genre, setGenre] = useState<'all' | string>('all');
    const [sortBy, setSortBy] = useState<
        'popularity' | 'members' | 'titles' | 'rating'
    >('popularity');

    const { groups, genres, isLoading } = useGroups({
        status,
        genre,
        sortBy,
    });

    return (
        <>
            <Header />
            <MainContent>
                <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Grupos de Tradução</h2>
                    <p className="text-sm text-tertiary">
                        Explore equipes, filtros de status/gênero e ordene por
                        popularidade.
                    </p>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <select
                            value={status}
                            onChange={event =>
                                setStatus(
                                    event.target.value as 'all' | GroupStatus,
                                )
                            }
                            className="p-2 text-sm rounded-xs border border-tertiary bg-secondary"
                        >
                            <option value="all">Todos os status</option>
                            <option value="active">Ativo</option>
                            <option value="hiatus">Hiato</option>
                            <option value="inactive">Inativo</option>
                        </select>

                        <select
                            value={genre}
                            onChange={event => setGenre(event.target.value)}
                            className="p-2 text-sm rounded-xs border border-tertiary bg-secondary"
                        >
                            <option value="all">Todos os gêneros</option>
                            {genres.map(item => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={event =>
                                setSortBy(
                                    event.target.value as
                                        | 'popularity'
                                        | 'members'
                                        | 'titles'
                                        | 'rating',
                                )
                            }
                            className="p-2 text-sm rounded-xs border border-tertiary bg-secondary"
                        >
                            <option value="popularity">Popularidade</option>
                            <option value="members">Total de membros</option>
                            <option value="titles">Obras traduzidas</option>
                            <option value="rating">Avaliação</option>
                        </select>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {isLoading
                        ? Array.from({ length: 8 }).map((_, index) => (
                              <GroupCard
                                  key={`skeleton-${index}`}
                                  group={{} as never}
                                  isLoading
                              />
                          ))
                        : groups.map(group => (
                              <GroupCard key={group.id} group={group} />
                          ))}
                </section>
            </MainContent>
            <Footer />
        </>
    );
};

export default Groups;
