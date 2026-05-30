import { useTranslation } from 'react-i18next';
import { Select } from '@ui/Select';
import { formatRelativeDate } from '@features/news';
import type { NewsComment } from '@features/news';
import { Heart, Smile } from 'lucide-react';

type CommentSort = 'recent' | 'relevant';

type NewsCommentsSectionProps = {
    comments: NewsComment[];
    commentSort: CommentSort;
    setCommentSort: (sort: CommentSort) => void;
    showSpoilers: boolean;
    setShowSpoilers: (updater: (current: boolean) => boolean) => void;
};

const NewsCommentsSection = ({ comments, commentSort, setCommentSort, showSpoilers, setShowSpoilers }: NewsCommentsSectionProps) => {
    const { t } = useTranslation('news');

    return (
        <section className="p-4 space-y-3 border rounded-xl border-tertiary bg-secondary">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">{t('details.comments')}</h2>
                <div className="flex gap-2">
                    <Select
                        options={[
                            {
                                value: 'recent',
                                label: t('details.sortRecent'),
                            },
                            {
                                value: 'relevant',
                                label: t('details.sortRelevant'),
                            },
                        ]}
                        value={commentSort}
                        onChange={event => setCommentSort(event.target.value as CommentSort)}
                        className="px-2 py-1 text-sm border rounded-xs border-tertiary bg-secondary"
                    />
                    <button type="button" onClick={() => setShowSpoilers(value => !value)} className="px-3 py-1 text-sm rounded-lg bg-primary">
                        {showSpoilers ? t('details.hideSpoilers') : t('details.showSpoilers')}
                    </button>
                </div>
            </div>

            {comments.map(comment => (
                <div key={comment.id} className="p-3 space-y-2 rounded-lg bg-primary">
                    <div className="flex items-center justify-between text-sm">
                        <p className="font-semibold">{comment.user}</p>
                        <p className="text-xs text-tertiary">{formatRelativeDate(comment.createdAt)}</p>
                    </div>
                    <p className={`text-sm ${comment.spoiler && !showSpoilers ? 'blur-sm select-none' : ''}`}>{comment.content}</p>
                    <div className="flex items-center gap-3 text-xs text-tertiary">
                        <span className="inline-flex items-center gap-1">
                            <Heart /> {comment.likes}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Smile /> {t('details.reply')}
                        </span>
                    </div>
                    {comment.replies?.map(reply => (
                        <div key={reply.id} className="p-2 ml-6 text-xs rounded-lg bg-secondary">
                            <strong>{reply.user}:</strong> {reply.content}
                        </div>
                    ))}
                </div>
            ))}
        </section>
    );
};

export default NewsCommentsSection;
