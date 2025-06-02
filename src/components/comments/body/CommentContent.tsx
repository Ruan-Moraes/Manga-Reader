import { UserTypes } from '../../../types/UserTypes';

type CommentContentProps = {
    textContent: string | undefined;
    imageContent: string | undefined;

    user: UserTypes;
};

const CommentContent = ({
    textContent,
    imageContent,
    user,
}: CommentContentProps) => {
    return (
        <div className="flex flex-col gap-2">
            {textContent && (
                <div>
                    <p className="text-xs text-justify">{textContent}</p>
                </div>
            )}
            {imageContent && (
                <div>
                    <img
                        src={imageContent}
                        alt={`Imagem do comentário de ${user.name}`}
                        className="object-cover object-center w-full rounded-xs max-h-[30rem]" // Se alterar aqui, não se esqueça de alterar no CommentInput.tsx
                    />
                </div>
            )}
        </div>
    );
};

export default CommentContent;
