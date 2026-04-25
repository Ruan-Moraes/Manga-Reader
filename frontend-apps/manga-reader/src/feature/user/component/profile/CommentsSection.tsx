import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { type CommentSummary } from '../../type/user.types';
import { getUserComments } from '../../service/userService';
import ProfileEmptyState from './ProfileEmptyState';
import PrivacyBadge from './PrivacyBadge';

type Props = {
    userId: string;
    isOwner: boolean;
    commentVisibility: string;
};

const CommentsSection = ({ userId, isOwner, commentVisibility }: Props) => {
    const { t, i18n } = useTranslation('user');
    const [comments, setComments] = useState<CommentSummary[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getUserComments(userId, page);
            setComments(data.content);
            setTotalPages(data.totalPages);
        } catch {
            setComments([]);
        } finally {
            setLoading(false);
        }
    }, [userId, page]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    if (loading) {
        return (
            <div className="px-4 py-3 animate-pulse">
                <div className="h-20 bg-tertiary/20 rounded-xs" />
            </div>
        );
    }

    return (
        <div className="px-4 py-3 space-y-3">
            {isOwner && commentVisibility !== 'PUBLIC' && (
                <PrivacyBadge visibility={commentVisibility} />
            )}

            {comments.length === 0 ? (
                <ProfileEmptyState message={t('profile.comments.empty')} />
            ) : (
                <ul className="space-y-2">
                    {comments.map(c => (
                        <li
                            key={c.id}
                            className="p-3 border rounded-xs border-tertiary bg-secondary/30"
                        >
                            <Link
                                to={`/Manga-Reader/title/${c.titleId}`}
                                className="text-xs text-quaternary hover:underline"
                            >
                                {t('profile.comments.viewTitle')}
                            </Link>
                            <p className="mt-1 text-sm line-clamp-2">
                                {c.textContent}
                            </p>
                            {c.createdAt && (
                                <p className="mt-1 text-[10px] text-tertiary">
                                    {new Date(c.createdAt).toLocaleDateString(
                                        i18n.language,
                                    )}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {totalPages > 1 && (
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-2 py-1 text-xs border rounded-xs border-tertiary disabled:opacity-30"
                    >
                        {t('profile.comments.previous')}
                    </button>
                    <span className="text-xs text-tertiary self-center">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages - 1}
                        className="px-2 py-1 text-xs border rounded-xs border-tertiary disabled:opacity-30"
                    >
                        {t('profile.comments.next')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CommentsSection;
