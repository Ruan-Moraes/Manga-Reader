import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IoSearchOutline } from 'react-icons/io5';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import SectionTitle from '@shared/component/title/SectionTitle';
import AppLink from '@shared/component/link/element/AppLink';

import useSearchTitles from '@feature/manga/hook/useSearchTitles';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') ?? '';
    const [page, setPage] = useState(0);

    const { data, isLoading, isError } = useSearchTitles(query, page);

    return (
        <>
            <Header />
            <MainContent>
                <SectionTitle title={`Resultados para "${query}"`} />

                {isLoading && (
                    <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex flex-col border rounded-xs border-tertiary animate-pulse"
                            >
                                <div className="h-44 mobile-md:h-56 bg-tertiary/30" />
                                <div className="p-2 space-y-2">
                                    <div className="h-4 rounded bg-tertiary/30" />
                                    <div className="w-2/3 h-3 rounded bg-tertiary/30" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isError && (
                    <div className="py-12 text-center">
                        <p className="text-tertiary">
                            Ocorreu um erro ao buscar os resultados. Tente
                            novamente.
                        </p>
                    </div>
                )}

                {!isLoading &&
                    !isError &&
                    data &&
                    data.content.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-4 py-16">
                            <IoSearchOutline
                                size={64}
                                className="text-tertiary"
                            />
                            <p className="text-tertiary">
                                Nenhum resultado encontrado para "{query}".
                            </p>
                        </div>
                    )}

                {!isLoading && !isError && data && data.content.length > 0 && (
                    <>
                        <p className="mb-4 text-sm text-tertiary">
                            {data.totalElements} resultado
                            {data.totalElements !== 1 ? 's' : ''} encontrado
                            {data.totalElements !== 1 ? 's' : ''}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {data.content.map(title => (
                                <div
                                    key={title.id}
                                    className="flex flex-col border rounded-xs border-tertiary"
                                >
                                    <AppLink
                                        link={`title/${title.id}`}
                                        className="block"
                                    >
                                        <img
                                            src={title.cover}
                                            alt={`Capa: ${title.name}`}
                                            className="object-cover w-full h-44 mobile-md:h-56"
                                        />
                                    </AppLink>
                                    <div className="p-2 border-t border-tertiary">
                                        <h3 className="text-sm font-bold truncate">
                                            <AppLink
                                                link={`title/${title.id}`}
                                                text={title.name}
                                            />
                                        </h3>
                                        <p className="text-xs text-tertiary truncate">
                                            {title.author}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="px-1.5 py-0.5 text-[0.625rem] rounded-xs bg-tertiary">
                                                {title.type}
                                            </span>
                                            {title.genres
                                                .slice(0, 2)
                                                .map(genre => (
                                                    <span
                                                        key={genre}
                                                        className="px-1.5 py-0.5 text-[0.625rem] rounded-xs bg-secondary"
                                                    >
                                                        {genre}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!data.last && (
                            <div className="flex justify-center mt-6">
                                <button
                                    type="button"
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-6 py-2 text-sm font-semibold border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                                >
                                    Carregar mais
                                </button>
                            </div>
                        )}

                        {data.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage(p => Math.max(0, p - 1))
                                    }
                                    disabled={page === 0}
                                    className="px-3 py-1 text-sm border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Anterior
                                </button>
                                <span className="text-sm text-tertiary">
                                    Página {page + 1} de {data.totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={data.last}
                                    className="px-3 py-1 text-sm border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Próxima
                                </button>
                            </div>
                        )}
                    </>
                )}
            </MainContent>
            <Footer />
        </>
    );
};

export default SearchResults;
