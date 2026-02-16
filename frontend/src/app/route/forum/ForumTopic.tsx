import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FiArrowLeft,
    FiCheckCircle,
    FiClock,
    FiEye,
    FiHeart,
    FiLock,
    FiMessageCircle,
    FiBookmark,
    FiShare2,
    FiThumbsUp,
    FiUser,
} from 'react-icons/fi';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';
import {
    filterForumTopics,
    formatRelativeDate,
    getCategoryColor,
    type ForumReply,
    type ForumTopic,
} from '@feature/forum';
import { mockForumTopics } from '@mock/data/forums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getTopicById = (id: string): ForumTopic | undefined =>
    mockForumTopics.find(t => t.id === id);

const roleLabel: Record<string, string> = {
    admin: 'Admin',
    moderator: 'Moderador',
    member: 'Membro',
};

const roleBadgeColor: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400',
    moderator: 'bg-blue-500/20 text-blue-400',
    member: 'bg-gray-500/20 text-gray-400',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ReplyCard = ({ reply }: { reply: ForumReply }) => (
    <div className="flex gap-3 p-4 border rounded-lg border-tertiary bg-secondary">
        <img
            src={reply.author.avatar}
            alt={reply.author.name}
            className="object-cover w-8 h-8 rounded-full shrink-0"
        />
        <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-shadow-default">
                    {reply.author.name}
                </span>
                <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${roleBadgeColor[reply.author.role]}`}
                >
                    {roleLabel[reply.author.role]}
                </span>
                <span className="text-shadow-secondary">
                    {formatRelativeDate(reply.createdAt)}
                </span>
                {reply.isEdited && (
                    <span className="italic text-shadow-secondary">
                        (editado)
                    </span>
                )}
                {reply.isBestAnswer && (
                    <span className="flex items-center gap-1 text-green-400">
                        <FiCheckCircle size={12} /> Melhor resposta
                    </span>
                )}
            </div>
            <p className="mt-2 text-sm text-shadow-default">{reply.content}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-shadow-secondary">
                <button className="flex items-center gap-1 transition-colors hover:text-quaternary-default">
                    <FiThumbsUp size={12} /> {reply.likes}
                </button>
                <button className="flex items-center gap-1 transition-colors hover:text-quaternary-default">
                    <FiMessageCircle size={12} /> Responder
                </button>
            </div>
        </div>
    </div>
);

const RelatedTopicCard = ({ topic }: { topic: ForumTopic }) => (
    <Link
        to={`/Manga-Reader/forum/${topic.id}`}
        className="block p-3 transition-colors border rounded-lg border-tertiary hover:bg-tertiary/30"
    >
        <h4 className="text-xs font-semibold truncate text-shadow-default">
            {topic.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-shadow-secondary">
            <span>{topic.replyCount} respostas</span>
            <span>·</span>
            <span>{formatRelativeDate(topic.lastActivityAt)}</span>
        </div>
    </Link>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const ForumTopic = () => {
    const { topicId } = useParams();
    const topic = topicId ? getTopicById(topicId) : undefined;
    const [replySort, setReplySort] = useState<'recent' | 'likes'>('recent');

    const sortedReplies = useMemo(() => {
        if (!topic) return [];
        return [...topic.replies].sort((a, b) => {
            if (replySort === 'likes') return b.likes - a.likes;
            return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );
        });
    }, [topic, replySort]);

    const relatedTopics = useMemo(() => {
        if (!topic) return [];
        return filterForumTopics({ category: topic.category, sort: 'popular' })
            .filter(t => t.id !== topic.id)
            .slice(0, 5);
    }, [topic]);

    if (!topic) {
        return (
            <>
                <Header />
                <MainContent>
                    <div className="py-16 text-center">
                        <p className="text-lg text-shadow-secondary">
                            Tópico não encontrado.
                        </p>
                        <Link
                            to="/Manga-Reader/forum"
                            className="inline-block mt-4 text-sm underline text-quaternary-default"
                        >
                            Voltar para o fórum
                        </Link>
                    </div>
                </MainContent>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <MainContent>
                {/* Breadcrumb */}
                <Link
                    to="/Manga-Reader/forum"
                    className="flex items-center gap-1 text-xs transition-colors text-shadow-secondary hover:text-quaternary-default"
                >
                    <FiArrowLeft size={14} /> Voltar para o fórum
                </Link>

                {/* Topic header */}
                <section className="p-4 border rounded-lg bg-secondary border-tertiary">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {topic.isPinned && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                                <FiBookmark size={10} /> Fixado
                            </span>
                        )}
                        {topic.isLocked && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                                <FiLock size={10} /> Trancado
                            </span>
                        )}
                        {topic.isSolved && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                <FiCheckCircle size={10} /> Resolvido
                            </span>
                        )}
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(topic.category)}`}
                        >
                            {topic.category}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-xl font-bold text-shadow-default">
                        {topic.title}
                    </h1>

                    {/* Author + date */}
                    <div className="flex items-center gap-3 mt-3">
                        <img
                            src={topic.author.avatar}
                            alt={topic.author.name}
                            className="object-cover w-10 h-10 rounded-full"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-shadow-default">
                                    {topic.author.name}
                                </span>
                                <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] ${roleBadgeColor[topic.author.role]}`}
                                >
                                    {roleLabel[topic.author.role]}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-shadow-secondary">
                                <FiClock size={11} />
                                <span>
                                    {formatRelativeDate(topic.createdAt)}
                                </span>
                                <span>·</span>
                                <FiUser size={11} />
                                <span>
                                    {topic.author.postCount} posts
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mt-4 text-sm whitespace-pre-line text-shadow-default">
                        {topic.content}
                    </div>

                    {/* Tags */}
                    {topic.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-4">
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

                    {/* Stats row */}
                    <div className="flex items-center gap-4 pt-4 mt-4 text-xs border-t border-tertiary text-shadow-secondary">
                        <span className="flex items-center gap-1">
                            <FiEye size={13} /> {topic.viewCount} visualizações
                        </span>
                        <span className="flex items-center gap-1">
                            <FiHeart size={13} /> {topic.likeCount} curtidas
                        </span>
                        <span className="flex items-center gap-1">
                            <FiMessageCircle size={13} /> {topic.replyCount}{' '}
                            respostas
                        </span>
                        <button className="flex items-center gap-1 ml-auto transition-colors hover:text-quaternary-default">
                            <FiShare2 size={13} /> Compartilhar
                        </button>
                    </div>
                </section>

                {/* Replies section */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold">
                            Respostas ({topic.replyCount})
                        </h2>
                        <select
                            value={replySort}
                            onChange={e =>
                                setReplySort(
                                    e.target.value as 'recent' | 'likes',
                                )
                            }
                            className="px-3 py-1.5 text-xs border rounded-lg bg-secondary border-tertiary focus:outline-none"
                        >
                            <option value="recent">Mais recentes</option>
                            <option value="likes">Mais curtidas</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-3">
                        {sortedReplies.length === 0 ? (
                            <p className="py-8 text-sm text-center text-shadow-secondary">
                                Nenhuma resposta ainda. Seja o primeiro a
                                responder!
                            </p>
                        ) : (
                            sortedReplies.map(reply => (
                                <ReplyCard key={reply.id} reply={reply} />
                            ))
                        )}
                    </div>

                    {/* Reply form placeholder */}
                    {!topic.isLocked && (
                        <div className="p-4 mt-4 border rounded-lg border-tertiary bg-secondary">
                            <h3 className="mb-2 text-sm font-semibold">
                                Escrever resposta
                            </h3>
                            <textarea
                                placeholder="Compartilhe sua opinião..."
                                rows={4}
                                className="w-full p-3 text-sm border rounded-lg resize-none bg-primary-default border-tertiary focus:outline-none focus:border-quaternary-default"
                            />
                            <div className="flex justify-end mt-2">
                                <button className="px-4 py-2 text-xs font-bold transition-colors rounded-lg bg-quaternary-default text-primary-default hover:bg-quaternary-default/80">
                                    Enviar resposta
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Related topics sidebar */}
                {relatedTopics.length > 0 && (
                    <section>
                        <h2 className="mb-3 text-sm font-bold">
                            Tópicos relacionados
                        </h2>
                        <div className="flex flex-col gap-2">
                            {relatedTopics.map(t => (
                                <RelatedTopicCard key={t.id} topic={t} />
                            ))}
                        </div>
                    </section>
                )}
            </MainContent>
            <Footer />
        </>
    );
};

export default ForumTopic;
