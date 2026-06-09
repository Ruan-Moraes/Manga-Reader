import { useComments } from '@entities/comment';
import { CommentsSection } from '@features/comment';

type CommentsTabProps = {
    titleId: string;
};

/**
 * Aba de comentários da obra. Busca os comentários por título e delega a
 * composição/listagem para a feature de comentários (mesma integração de News).
 */
const CommentsTab = ({ titleId }: CommentsTabProps) => {
    const { comments, isLoading, isError, error, refetchComments } = useComments(titleId);

    return <CommentsSection titleId={titleId} comments={comments} isLoading={isLoading} isError={isError} error={error} onCommentCreated={refetchComments} />;
};

export default CommentsTab;
