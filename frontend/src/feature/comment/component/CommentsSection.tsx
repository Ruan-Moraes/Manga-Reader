import { CommentData } from '../type/comment.types';

import CommentInput from './CommentInput';
import SortComments from './SortComments';
import CommentsList from './CommentsList';

type CommentsSectionProps = {
    comments: CommentData[];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
};

const CommentsSection = ({
    comments,
    isLoading,
    isError,
    error,
}: CommentsSectionProps) => {
    return (
        <section className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <div>
                    <h3 className="text-xl font-bold">Comentários</h3>
                </div>
                <div className="flex flex-col gap-4">
                    <CommentInput placeholder="Deixe seu comentário" />
                    <SortComments title="Ordernar comentários por:" />
                </div>
            </div>
            <CommentsList
                comments={comments}
                isLoading={isLoading}
                isError={isError}
                error={error}
            />
        </section>
    );
};

export default CommentsSection;
