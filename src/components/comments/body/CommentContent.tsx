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
            src={commentImage}
            alt={`Imagem do comentário de ${user.name}`} // TODO: Alterar para quando o sistema de comentários estiver pronto
            className="object-cover object-center w-full rounded-xs max-h-64"
          />
        </div>
      )}
    </div>
  );
};

export default CommentContent;
