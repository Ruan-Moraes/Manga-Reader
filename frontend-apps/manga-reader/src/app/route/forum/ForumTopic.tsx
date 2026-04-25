import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    FiUser,
} from 'react-icons/fi';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';
import BaseSelect from '@shared/component/input/BaseSelect';
import UserAvatar from '@shared/component/avatar/UserAvatar';
import {
    useForumTopic,
    ReplyCard,
    RelatedTopicCard,
    formatRelativeDate,
    getCategoryColor,
    roleBadgeColor,
} from '@feature/forum';

const ForumTopicPage = () => {
    const { t } = useTranslation('forum');
    const { topic, replySort, setReplySort, sortedReplies, relatedTopics } =
        useForumTopic();

    const replySortOptions = useMemo(
        () => [
            { value: 'recent', label: t('topicPage.sortRecent') },
            { value: 'likes', label: t('topicPage.sortLikes') },
        ],
        [t],
    );

    if (!topic) {
        return (
            <>
                <Header />
                <MainContent>
                    <div className="py-16 text-center">
                        <p className="text-lg text-shadow-secondary">
                            {t('topicPage.notFound')}
                        </p>
                        <Link
                            to="/Manga-Reader/forum"
                            className="inline-block mt-4 text-sm underline text-quaternary-default"
                        >
                            {t('topicPage.backToForum')}
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
                <Link
                    to="/Manga-Reader/forum"
                    className="flex items-center gap-1 text-xs transition-colors text-shadow-secondary hover:text-quaternary-default"
                >
                    <FiArrowLeft size={14} /> {t('topicPage.backToForum')}
                </Link>

                <section className="p-4 border rounded-lg bg-secondary border-tertiary">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {topic.isPinned && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                                <FiBookmark size={10} /> {t('topicPage.pinned')}
                            </span>
                        )}
                        {topic.isLocked && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                                <FiLock size={10} /> {t('topicPage.locked')}
                            </span>
                        )}
                        {topic.isSolved && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                <FiCheckCircle size={10} /> {t('topicPage.solved')}
                            </span>
                        )}
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(topic.category)}`}
                        >
                            {t(`categories.${topic.category}`, {
                                defaultValue: topic.category,
                            })}
                        </span>
                    </div>

                    <h1 className="text-xl font-bold text-shadow-default">
                        {topic.title}
                    </h1>

                    <div className="flex items-center gap-3 mt-3">
                        <UserAvatar
                            src={topic.author.avatar}
                            name={topic.author.name}
                            size="md"
                            rounded="full"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-shadow-default">
                                    {topic.author.name}
                                </span>
                                <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] ${roleBadgeColor[topic.author.role]}`}
                                >
                                    {t(`role.${topic.author.role}`, {
                                        defaultValue: topic.author.role,
                                    })}
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
                                    {t('topicPage.postsCount', {
                                        count: topic.author.postCount,
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-sm whitespace-pre-line text-shadow-default">
                        {topic.content}
                    </div>

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

                    <div className="flex items-center gap-4 pt-4 mt-4 text-xs border-t border-tertiary text-shadow-secondary">
                        <span className="flex items-center gap-1">
                            <FiEye size={13} />{' '}
                            {t('topicPage.views', { count: topic.viewCount })}
                        </span>
                        <span className="flex items-center gap-1">
                            <FiHeart size={13} />{' '}
                            {t('topicPage.likes', { count: topic.likeCount })}
                        </span>
                        <span className="flex items-center gap-1">
                            <FiMessageCircle size={13} />{' '}
                            {t('topicPage.replies', { count: topic.replyCount })}
                        </span>
                        <button className="flex items-center gap-1 ml-auto transition-colors hover:text-quaternary-default">
                            <FiShare2 size={13} /> {t('topicPage.share')}
                        </button>
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold">
                            {t('topicPage.repliesHeading', {
                                count: topic.replyCount,
                            })}
                        </h2>
                        <BaseSelect
                            options={replySortOptions}
                            value={replySort}
                            onChange={e =>
                                setReplySort(
                                    e.target.value as 'recent' | 'likes',
                                )
                            }
                            className="px-3 py-1.5 text-xs border rounded-xs bg-secondary border-tertiary"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        {sortedReplies.length === 0 ? (
                            <p className="py-8 text-sm text-center text-shadow-secondary">
                                {t('topicPage.emptyReplies')}
                            </p>
                        ) : (
                            sortedReplies.map(reply => (
                                <ReplyCard key={reply.id} reply={reply} />
                            ))
                        )}
                    </div>

                    {!topic.isLocked && (
                        <div className="p-4 mt-4 border rounded-lg border-tertiary bg-secondary">
                            <h3 className="mb-2 text-sm font-semibold">
                                {t('topicPage.writeReply')}
                            </h3>
                            <textarea
                                placeholder={t('topicPage.replyPlaceholder')}
                                rows={4}
                                className="w-full p-3 text-sm border rounded-lg resize-none bg-primary-default border-tertiary focus:outline-none focus:border-quaternary-default"
                            />
                            <div className="flex justify-end mt-2">
                                <button className="px-4 py-2 text-xs font-bold transition-colors rounded-lg bg-quaternary-default text-primary-default hover:bg-quaternary-default/80">
                                    {t('topicPage.sendReply')}
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {relatedTopics.length > 0 && (
                    <section>
                        <h2 className="mb-3 text-sm font-bold">
                            {t('topicPage.relatedTopics')}
                        </h2>
                        <div className="flex flex-col gap-2">
                            {relatedTopics.map(rt => (
                                <RelatedTopicCard key={rt.id} topic={rt} />
                            ))}
                        </div>
                    </section>
                )}
            </MainContent>
            <Footer />
        </>
    );
};

export default ForumTopicPage;
