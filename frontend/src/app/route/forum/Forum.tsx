import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiMessageSquare,
    FiSearch,
    FiEye,
    FiHeart,
    FiMessageCircle,
    FiChevronLeft,
    FiChevronRight,
    FiCheckCircle,
    FiLock,
    FiBookmark,
} from 'react-icons/fi';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';
import {
    filterForumTopics,
    formatRelativeDate,
    getCategoryColor,
    paginateTopics,
    forumCategories,
    forumSortOptions,
    type ForumCategory,
    type ForumSort,
    type ForumTopic,
} from '@feature/forum';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const TopicCard = ({ topic }: { topic: ForumTopic }) => (
    <Link
        to={`/Manga-Reader/forum/${topic.id}`}
        className="flex gap-4 p-4 transition-colors border rounded-lg border-tertiary bg-secondary hover:bg-tertiary/30"
    >
        {/* Avatar */}
        <img
            src={topic.author.avatar}
            alt={topic.author.name}
            className="object-cover w-10 h-10 rounded-full shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2">
                {topic.isPinned && (
                    <FiBookmark className="text-yellow-400 shrink-0" size={14} />
                )}
                {topic.isLocked && (
                    <FiLock className="text-red-400 shrink-0" size={14} />
                )}
                {topic.isSolved && (
                    <FiCheckCircle
                        className="text-green-400 shrink-0"
                        size={14}
                    />
                )}
                <h3 className="text-sm font-semibold truncate text-shadow-default">
                    {topic.title}
                </h3>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-shadow-secondary">
                <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(topic.category)}`}
                >
                    {topic.category}
                </span>
                <span>por {topic.author.name}</span>
                <span>·</span>
                <span>{formatRelativeDate(topic.createdAt)}</span>
            </div>

            {/* Tags */}
            {topic.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {topic.tags.map(tag => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] rounded bg-tertiary text-shadow-secondary"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Preview */}
            <p className="mt-2 text-xs line-clamp-2 text-shadow-secondary">
                {topic.content}
            </p>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 text-xs shrink-0 text-shadow-secondary">
            <span className="flex items-center gap-1">
                <FiMessageCircle size={12} /> {topic.replyCount}
            </span>
            <span className="flex items-center gap-1">
                <FiEye size={12} /> {topic.viewCount}
            </span>
            <span className="flex items-center gap-1">
                <FiHeart size={12} /> {topic.likeCount}
            </span>
        </div>
    </Link>
);

const Pagination = ({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (p: number) => void;
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-4">
            <button
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
                className="p-2 transition-colors rounded disabled:opacity-30 hover:bg-tertiary"
            >
                <FiChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 text-sm rounded transition-colors ${
                        p === page
                            ? 'bg-quaternary-default text-primary-default font-bold'
                            : 'hover:bg-tertiary'
                    }`}
                >
                    {p}
                </button>
            ))}

            <button
                disabled={page === totalPages}
                onClick={() => onPageChange(page + 1)}
                className="p-2 transition-colors rounded disabled:opacity-30 hover:bg-tertiary"
            >
                <FiChevronRight size={16} />
            </button>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Stats banner
// ---------------------------------------------------------------------------

const ForumStats = ({ topics }: { topics: ForumTopic[] }) => {
    const totalReplies = topics.reduce((s, t) => s + t.replyCount, 0);
    const totalViews = topics.reduce((s, t) => s + t.viewCount, 0);

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
                { label: 'Tópicos', value: topics.length },
                { label: 'Respostas', value: totalReplies },
                { label: 'Visualizações', value: totalViews },
                {
                    label: 'Membros ativos',
                    value: new Set(topics.map(t => t.author.id)).size,
                },
            ].map(({ label, value }) => (
                <div
                    key={label}
                    className="p-3 text-center border rounded-lg bg-secondary border-tertiary"
                >
                    <p className="text-lg font-bold text-quaternary-default">
                        {value.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-shadow-secondary">{label}</p>
                </div>
            ))}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const Forum = () => {
    const [activeCategory, setActiveCategory] = useState<'all' | ForumCategory>(
        'all',
    );
    const [sort, setSort] = useState<ForumSort>('recent');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);

    const allTopics = useMemo(
        () =>
            filterForumTopics({
                category: activeCategory,
                sort,
                query,
            }),
        [activeCategory, sort, query],
    );

    const { items: topics, totalPages } = useMemo(
        () => paginateTopics(allTopics, page),
        [allTopics, page],
    );

    // Reset page when filters change
    const updateCategory = (cat: 'all' | ForumCategory) => {
        setActiveCategory(cat);
        setPage(1);
    };
    const updateSort = (s: ForumSort) => {
        setSort(s);
        setPage(1);
    };
    const updateQuery = (q: string) => {
        setQuery(q);
        setPage(1);
    };

    return (
        <>
            <Header />
            <MainContent>
                {/* Hero */}
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

                {/* Stats */}
                <ForumStats topics={allTopics} />

                {/* Filters */}
                <section className="flex flex-col gap-3">
                    {/* Search */}
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

                    {/* Category pills */}
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

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-shadow-secondary">
                            Ordenar:
                        </span>
                        <select
                            value={sort}
                            onChange={e => updateSort(e.target.value as ForumSort)}
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

                {/* Topic list */}
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

                {/* Pagination */}
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
