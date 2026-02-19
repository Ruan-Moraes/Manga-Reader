import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AppLink from '@shared/component/link/element/AppLink';

import { useSavedMangas } from '@feature/library';

// TODO: Refatorar esse componente, ele está muito grande e precisa ser dividido em subcomponentes menores para melhorar a legibilidade e manutenção. Talvez criar um componente específico para o leitor de capítulos, outro para a navegação entre capítulos e outro para os comentários.
const Library = () => {
    const { savedByList } = useSavedMangas();

    return (
        <>
            <Header />
            <MainContent>
                <section>
                    <h2 className="text-xl font-bold">Minha Biblioteca</h2>
                    <p className="text-sm text-tertiary">
                        Organizada automaticamente por status de leitura.
                    </p>
                </section>

                {Object.entries(savedByList).map(([status, mangas]) => (
                    <section
                        key={status}
                        className="p-3 border rounded-xs border-tertiary"
                    >
                        <h3 className="mb-3 font-bold">{status}</h3>
                        <div className="grid grid-cols-1 gap-3 mobile-md:grid-cols-2">
                            {mangas.length === 0 ? (
                                <p className="text-sm text-tertiary">
                                    Nenhum mangá nesta lista.
                                </p>
                            ) : (
                                mangas.map(manga => (
                                    <article
                                        key={manga.titleId}
                                        className="flex items-center gap-2 p-2 border rounded-xs border-tertiary/70 hover:bg-secondary transition-colors"
                                    >
                                        <img
                                            src={manga.cover}
                                            alt={manga.name}
                                            className="object-cover w-12 h-16 rounded-xs"
                                        />
                                        <div className="flex flex-col">
                                            <AppLink
                                                link={`/title/${manga.titleId}`}
                                                text={manga.name}
                                                className="text-sm"
                                            />
                                            <span className="text-xs text-tertiary">
                                                {manga.type}
                                            </span>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                ))}
            </MainContent>
            <Footer />
        </>
    );
};

export default Library;
