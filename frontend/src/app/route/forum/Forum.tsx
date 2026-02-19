import { FiMessageSquare, FiSearch } from 'react-icons/fi';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import {
    useForumPage,
    TopicCard,
    Pagination,
    ForumStats,
    forumCategories,
    forumSortOptions,
    type ForumSort,
} from '@feature/forum';

// TODO: Refatorar esse componente, ele está muito grande e precisa ser dividido em subcomponentes menores para melhorar a legibilidade e manutenção. Talvez criar um componente específico para o leitor de capítulos, outro para a navegação entre capítulos e outro para os comentários.
const Forum = () => {
    const {
        activeCategory,
        sort,
        query,
        page,
        setPage,
        allTopics,
        topics,
        totalPages,
        updateCategory,
        updateSort,
        updateQuery,
    } = useForumPage();

    return (
        <>
            <Header />
            <MainContent>
                <section className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <FiMessageSquare
                            className="text-quaternary-default"
                            size={28}
                        />
                        <h1 className="text-2xl font-bold">Fórum</h1>
                    </div>
                    <p className="max-w-xl mx-auto text-sm text-shadow-secondary">
                        Participe das discussões, compartilhe recomendações e
                        conecte-se com outros leitores de mangá.
                    </p>
                </section>
                <ForumStats topics={allTopics} />
                <section className="flex flex-col gap-3">
                    <div className="relative">
                        <FiSearch
                            className="absolute -translate-y-1/2 left-3 top-1/2 text-shadow-secondary"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Buscar tópicos..."
                            value={query}
                            onChange={e => updateQuery(e.target.value)}
                            className="w-full py-2 pl-10 pr-4 text-sm border rounded-lg bg-secondary border-tertiary focus:outline-none focus:border-quaternary-default"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => updateCategory('all')}
                            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                                activeCategory === 'all'
                                    ? 'bg-quaternary-default text-primary-default font-bold'
                                    : 'bg-secondary border border-tertiary hover:bg-tertiary'
                            }`}
                        >
                            Todos
                        </button>
                        {forumCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => updateCategory(cat)}
                                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                                    activeCategory === cat
                                        ? 'bg-quaternary-default text-primary-default font-bold'
                                        : 'bg-secondary border border-tertiary hover:bg-tertiary'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-shadow-secondary">
                            Ordenar:
                        </span>
                        <select
                            value={sort}
                            onChange={e =>
                                updateSort(e.target.value as ForumSort)
                            }
                            className="px-3 py-1.5 text-xs border rounded-lg bg-secondary border-tertiary focus:outline-none"
                        >
                            {forumSortOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        <span className="ml-auto text-xs text-shadow-secondary">
                            {allTopics.length} tópico
                            {allTopics.length !== 1 ? 's' : ''} encontrado
                            {allTopics.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </section>
                <section className="flex flex-col gap-3">
                    {topics.length === 0 ? (
                        <div className="py-12 text-center">
                            <FiMessageSquare
                                className="mx-auto mb-3 text-shadow-secondary"
                                size={40}
                            />
                            <p className="text-sm text-shadow-secondary">
                                Nenhum tópico encontrado.
                            </p>
                        </div>
                    ) : (
                        topics.map(topic => (
                            <TopicCard key={topic.id} topic={topic} />
                        ))
                    )}
                </section>
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </MainContent>
            <Footer />
        </>
    );
};

export default Forum;
