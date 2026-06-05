import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '@shared/lib/useMediaQuery';
import { type User, useUserModalContext, UserModal, buildUserModalPayload } from '@entities/user';
import { type CommentData, type CommentReactions, useCommentTree, useCommentPagination } from '@entities/comment';

import useCommentCRUD from '../model/internal/useCommentCRUD';
import useCommentReactions from '../model/internal/useCommentReactions';
import Comment from './Comment';

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';
const MAX_DEPTH_DESKTOP = 7;
const MAX_DEPTH_MOBILE = 1;

type CommentsListProps = {
    titleId: string;
    comments?: CommentData[];
    isLoading?: boolean;
    isError?: boolean;
    error?: Error | null;
};

const CommentsList = ({ titleId, comments, isLoading, isError, error }: CommentsListProps) => {
    const { t } = useTranslation('comment');
    const { openUserModal, setUserData } = useUserModalContext();

    const { deleteComment, editComment, replyComment } = useCommentCRUD();

    const { getCommentsTreeNested } = useCommentTree(comments || []);

    const roots = comments ? getCommentsTreeNested() : [];

    const { visibleItems, hasMore, loadMore } = useCommentPagination(roots);

    const commentIds = useMemo(() => (comments ?? []).map(c => c.id), [comments]);

    const { reactionsMap, toggleLike, toggleDislike } = useCommentReactions(commentIds);

    // Profundidade visual: 3 níveis no desktop, 2 no mobile (igual ao protótipo).
    const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
    const maxDepth = isDesktop ? MAX_DEPTH_DESKTOP : MAX_DEPTH_MOBILE;

    const handleClickProfile = useCallback(
        (user: User): void => {
            setUserData(buildUserModalPayload(user));
            openUserModal();
        },
        [openUserModal, setUserData],
    );

    if (isLoading) {
        return <div className="text-center text-tertiary">{t('list.loading')}</div>;
    }

    if (isError) {
        return <div className="text-center text-quinary-default">{error!.message || t('list.unknownError')}</div>;
    }

    return (
        <div className="flex flex-col gap-3">
            <UserModal />
            {visibleItems.map(root => (
                <Comment
                    key={root.id}
                    data={root}
                    depth={0}
                    titleId={titleId}
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
