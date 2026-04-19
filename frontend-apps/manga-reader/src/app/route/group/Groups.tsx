import { useState } from 'react';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';
import BaseSelect from '@shared/component/input/BaseSelect';
import SearchInput from '@shared/component/input/SearchInput';

import { GroupCard, useGroups, type GroupStatus } from '@feature/group';

// TODO: Refatorar esse componente, ele está muito grande e precisa ser dividido em subcomponentes menores para melhorar a legibilidade e manutenção. Talvez criar um componente específico para o leitor de capítulos, outro para a navegação entre capítulos e outro para os comentários.
const Groups = () => {
    const [status, setStatus] = useState<'all' | GroupStatus>('all');
    const [genre, setGenre] = useState<'all' | string>('all');
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState<
        'popularity' | 'members' | 'titles' | 'rating'
    >('popularity');

    const { groups, genres, isLoading } = useGroups({
        status,
        genre,
        sortBy,
        query,
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

                    <SearchInput
                        value={query}
                        onChange={setQuery}
                        placeholder="Buscar por nome do grupo"
                    />

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <BaseSelect
                            options={[
                                { value: 'all', label: 'Todos os status' },
                                { value: 'active', label: 'Ativo' },
                                { value: 'hiatus', label: 'Hiato' },
                                { value: 'inactive', label: 'Inativo' },
                            ]}
                            value={status}
                            onChange={event =>
                                setStatus(
                                    event.target.value as 'all' | GroupStatus,
                                )
                            }
                            className="w-full p-2 text-sm border rounded-xs border-tertiary bg-secondary"
                        />

                        <BaseSelect
                            options={[
                                { value: 'all', label: 'Todos os gêneros' },
                                ...genres.map(item => ({
                                    value: item,
                                    label: item,
                                })),
                            ]}
                            value={genre}
                            onChange={event => setGenre(event.target.value)}
                            className="w-full p-2 text-sm border rounded-xs border-tertiary bg-secondary"
                        />

                        <BaseSelect
                            options={[
                                { value: 'popularity', label: 'Popularidade' },
                                {
                                    value: 'members',
                                    label: 'Total de membros',
                                },
                                {
                                    value: 'titles',
                                    label: 'Obras traduzidas',
                                },
                                { value: 'rating', label: 'Avaliação' },
                            ]}
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
                            className="w-full p-2 text-sm border rounded-xs border-tertiary bg-secondary"
                        />
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
