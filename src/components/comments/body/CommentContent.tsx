import { UserTypes } from '../../../types/UserTypes';

type CommentContentProps = {
  commentText: string | undefined;
  commentImage: string | undefined;

  user: UserTypes;
};

const CommentContent = ({
  commentText,
  commentImage,
  user,
}: CommentContentProps) => {
  return (
    <div className="flex flex-col gap-2">
      {commentText && (
        <div>
          <p className="text-xs text-justify">{commentText}</p>
        </div>
      )}
      {commentImage && (
        <div>
          <img
            className="object-cover w-full rounded-sm max-h-64"
            src={commentImage}
            alt={`Imagem do comentário de ${user.name}`} // TODO: Alterar para quando o sistema de comentários estiver pronto
          />
        </div>
      )}
    </div>
  );
};

export default CommentContent;
