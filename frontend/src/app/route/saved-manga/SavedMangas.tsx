import { useState } from 'react';

import Header from '@app/layout/Header';
import Main from '@app/layout/Main';
import Footer from '@app/layout/Footer';

import CustomLink from '@shared/component/link/element/CustomLink';
import { useSavedMangas, type ReadingListType } from '@feature/library';

const listTypes: ReadingListType[] = ['Lendo', 'Quero Ler', 'Concluído'];

const SavedMangas = () => {
    const [selectedList, setSelectedList] = useState<ReadingListType | 'Todos'>(
        'Todos',
    );

    const { savedMangas, changeList, removeFromSaved } = useSavedMangas();

    const visibleMangas =
        selectedList === 'Todos'
            ? savedMangas
            : savedMangas.filter(item => item.list === selectedList);

    return (
        <>
            <Header />
            <Main>
                <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Meus Mangás Salvos</h2>
                    <div className="flex flex-wrap gap-2">
                        {(['Todos', ...listTypes] as const).map(list => (
                            <button
                                key={list}
                                onClick={() => setSelectedList(list)}
                                className={`px-3 py-1 border rounded-xs transition-colors ${
                                    selectedList === list
                                        ? 'bg-tertiary text-shadow-default'
                                        : 'bg-secondary border-tertiary'
                                }`}
                            >
                                {list}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-3 mobile-md:grid-cols-2">
                    {visibleMangas.map(manga => (
                        <article
                            key={manga.titleId}
                            className="flex gap-3 p-2 border rounded-xs border-tertiary"
                        >
                            <img
                                src={manga.cover}
                                alt={manga.name}
                                className="object-cover w-20 h-28 rounded-xs"
                            />
                            <div className="flex flex-col flex-1 gap-2">
                                <CustomLink
                                    link={`/title/${manga.titleId}`}
                                    text={manga.name}
                                    className="text-sm"
                                />
                                <p className="text-xs text-tertiary">
                                    {manga.type}
                                </p>
                                <select
                                    value={manga.list}
                                    onChange={event =>
                                        changeList(
                                            manga.titleId,
                                            event.target
                                                .value as ReadingListType,
                                        )
                                    }
                                    className="px-2 py-1 text-xs border rounded-xs border-tertiary bg-secondary"
                                >
                                    {listTypes.map(list => (
                                        <option key={list} value={list}>
                                            {list}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                'Deseja remover este mangá dos salvos?',
                                            )
                                        ) {
                                            removeFromSaved(manga.titleId);
                                        }
                                    }}
                                    className="px-2 py-1 text-xs border rounded-xs border-tertiary bg-secondary hover:bg-primary-default"
                                >
                                    Remover dos salvos
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </Main>
            <Footer />
        </>
    );
};

export default SavedMangas;
