import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AppLink from '@shared/component/link/element/AppLink';
import AlertBanner from '@shared/component/notification/AlertBanner';
import { THEME_COLORS } from '@shared/constant/THEME_COLORS';
import {
    useGroupDetails,
    GroupDetailHeader,
    MemberListModal,
} from '@feature/group';

const GroupProfile = () => {
    const { groupId } = useParams();
    const [isMemberListModalOpen, setIsMemberListModalOpen] =
        useState<boolean>(false);
    const [workSort, setWorkSort] = useState<
        'popularity' | 'date' | 'chapters'
    >('popularity');
    const [activeGenre, setActiveGenre] = useState<string | null>(null);

    const { group, isLoading } = useGroupDetails(groupId);

    const sortedWorks = useMemo(() => {
        if (!group) return [];

        const scopedWorks = activeGenre
            ? group.translatedWorks.filter(work =>
                  work.genres.includes(activeGenre),
              )
            : group.translatedWorks;

        const works = [...scopedWorks];

        works.sort((a, b) => {
            if (workSort === 'date') {
                return (
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
                );
            }

            if (workSort === 'chapters') {
                return b.chapters - a.chapters;
            }

            return b.popularity - a.popularity;
        });

        return works;
    }, [activeGenre, group, workSort]);

    if (!isLoading && !group) {
        return (
            <MainContent>
                <AlertBanner
                    color={THEME_COLORS.QUINARY}
                    title="Grupo não encontrado"
                    message="Não foi possível localizar o perfil solicitado."
                    link="/groups"
                    linkText="Voltar para Grupos"
                />
            </MainContent>
        );
    }

    return (
        <>
            <Header />
            <MainContent>
                {group && (
                    <>
                        <GroupDetailHeader
                            group={group}
                            onOpenMembers={() => setIsMemberListModalOpen(true)}
                        />

                        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <article className="flex flex-col gap-3 p-4 border rounded-xs border-tertiary bg-secondary/40 lg:col-span-2">
                                <h3 className="font-bold">Sobre o grupo</h3>
                                <p className="text-sm text-tertiary">
                                    {group.description}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {group.genres.map(genre => (
                                        <button
                                            key={genre}
                                            onClick={() =>
                                                setActiveGenre(prev =>
                                                    prev === genre
                                                        ? null
                                                        : genre,
                                                )
                                            }
                                            className={`px-2 py-1 text-xs border rounded-xs transition-colors ${
                                                activeGenre === genre
                                                    ? 'border-quaternary text-quaternary'
                                                    : 'border-tertiary text-tertiary hover:border-quaternary'
                                            }`}
                                        >
                                            {genre}
                                        </button>
                                    ))}
                                </div>

                                <p className="text-xs text-tertiary">
                                    Fundação: {group.foundedYear} • Entrada na
                                    plataforma:{' '}
                                    {new Date(
                                        group.platformJoinedAt,
                                    ).toLocaleDateString('pt-BR')}
                                </p>
                            </article>
                        </section>

                        <section className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold">Obras traduzidas</h3>
                                <select
                                    value={workSort}
                                    onChange={event =>
                                        setWorkSort(
                                            event.target.value as
                                                | 'popularity'
                                                | 'date'
                                                | 'chapters',
                                        )
                                    }
                                    className="p-2 text-xs border rounded-xs border-tertiary bg-secondary"
                                >
                                    <option value="popularity">
                                        Popularidade
                                    </option>
                                    <option value="date">
                                        Data de atualização
                                    </option>
                                    <option value="chapters">Capítulos</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {sortedWorks.map(work => (
                                    <AppLink
                                        key={work.id}
                                        link={`/title/${work.id}`}
                                        className="overflow-hidden transition-all border rounded-xs border-tertiary bg-secondary/40 hover:border-quaternary hover:shadow-default"
                                    >
                                        <img
                                            src={work.cover}
                                            alt={work.title}
                                            className="object-cover w-full h-40"
                                        />
                                        <div className="flex flex-col gap-1 p-2">
                                            <h4 className="text-sm font-bold line-clamp-1">
                                                {work.title}
                                            </h4>
                                            <p className="text-xs text-tertiary">
                                                {work.chapters} capítulos
                                            </p>
                                            <span
                                                className={`w-fit px-2 py-1 text-[0.65rem] border rounded-xs ${
                                                    work.status === 'ongoing'
                                                        ? 'border-green-400 text-green-300'
                                                        : 'border-blue-400 text-blue-300'
                                                }`}
                                            >
                                                {work.status === 'ongoing'
                                                    ? 'Em andamento'
                                                    : 'Completo'}
                                            </span>
                                        </div>
                                    </AppLink>
                                ))}
                            </div>
                        </section>

                        <MemberListModal
                            isOpen={isMemberListModalOpen}
                            closeModal={() => setIsMemberListModalOpen(false)}
                            group={group}
                        />
                    </>
                )}

                {isLoading && (
                    <section className="p-4 border rounded-xs border-tertiary animate-pulse">
                        <p className="text-tertiary">
                            Carregando perfil do grupo...
                        </p>
                    </section>
                )}
            </MainContent>
            <Footer />
        </>
    );
};

export default GroupProfile;
