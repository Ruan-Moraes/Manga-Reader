import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '@shared/lib/useMediaQuery';
import { type User, useUserModalContext } from '@entities/user';
import { type CommentData, type CommentReactions, useCommentTree, useCommentPagination } from '@entities/comment';

import useCommentCRUD from '../model/internal/useCommentCRUD';
import useCommentReactions from '../model/internal/useCommentReactions';
import Comment from './Comment';

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';
const MAX_DEPTH_DESKTOP = 7;

type CommentsListProps = {
    targetId: string;
    targetType: string;
    comments?: CommentData[];
    isLoading?: boolean;
    isError?: boolean;
    error?: Error | null;
};

const CommentsList = ({ targetId, targetType, comments, isLoading, isError, error }: CommentsListProps) => {
    const { t } = useTranslation('comment');
    const { openUserModalById } = useUserModalContext();

    const { deleteComment, editComment, replyComment } = useCommentCRUD(targetType);

    const { getCommentsTreeNested } = useCommentTree(comments || []);

    const roots = comments ? getCommentsTreeNested() : [];

    const { visibleItems, hasMore, loadMore } = useCommentPagination(roots);

    const commentIds = useMemo(() => (comments ?? []).map(c => c.id), [comments]);

    const { reactionsMap, toggleLike, toggleDislike } = useCommentReactions(commentIds);

    // Mobile limita apenas o recuo visual; a árvore continua sendo renderizada por completo.
    const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
    const maxDepth = isDesktop ? MAX_DEPTH_DESKTOP : Number.POSITIVE_INFINITY;

    const handleClickProfile = useCallback(
        (user: User): void => {
            openUserModalById(user.id, { name: user.name, photo: user.photo });
        },
        [openUserModalById],
    );

    if (isLoading) {
        return <div className="text-center text-tertiary">{t('list.loading')}</div>;
    }

    if (isError) {
        return <div className="text-center text-quinary-default">{error!.message || t('list.unknownError')}</div>;
    }

    return (
        <div className="flex flex-col gap-3">
            {visibleItems.map(root => (
                <Comment
                    key={root.id}
                    data={root}
                    depth={0}
                    targetId={targetId}
                    targetType={targetType}
                    maxDepth={maxDepth}
                    reactionsMap={reactionsMap as CommentReactions}
                    onClickProfile={handleClickProfile}
                    onClickEdit={editComment}
                    onClickDelete={deleteComment}
                    onClickReply={replyComment}
                    onLike={toggleLike}
                    onDislike={toggleDislike}
                />
            ))}
            {hasMore && (
                <button
                    type="button"
                    onClick={loadMore}
                    className="mt-4 self-center text-sm font-semibold text-quaternary-default hover:text-quaternary-light transition-colors cursor-pointer"
                >
                    {t('list.loadMore')}
                </button>
            )}
            {roots.length === 0 && !isLoading && !isError && <div className="text-gray-400 text-center mt-12 font-bold">{t('list.empty')}</div>}
        </div>
    );
};

export default CommentsList;
