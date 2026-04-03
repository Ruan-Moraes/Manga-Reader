import { getStoredSession } from '@feature/auth/service/authService';

import { CommentData } from '../type/comment.types';

import CommentInput from './CommentInput';
import SortComments from './SortComments';
import CommentsList from './CommentsList';

type CommentsSectionProps = {
    titleId: string;
    comments: CommentData[];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    onCommentCreated?: () => void;
};

const CommentsSection = ({
    titleId,
    comments,
    isLoading,
    isError,
    error,
    onCommentCreated,
}: CommentsSectionProps) => {
    return (
        <section className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <div>
                    <h3 className="text-xl font-bold">Comentários</h3>
                </div>
                <div className="flex flex-col gap-4">
                    {getStoredSession() ? (
                        <CommentInput
                            placeholder="Deixe seu comentário"
                            titleId={titleId}
                            onCommentCreated={onCommentCreated}
                        />
                    ) : (
                        <p className="p-3 text-xs border rounded-xs border-tertiary bg-secondary text-tertiary">
                            Faça login para deixar um comentário.
                        </p>
                    )}
                    <SortComments title="Ordernar comentários por:" />
                </div>
            </div>
            <CommentsList
                titleId={titleId}
                comments={comments}
                isLoading={isLoading}
                isError={isError}
                error={error}
            />
        </section>
    );
};

export default CommentsSection;
