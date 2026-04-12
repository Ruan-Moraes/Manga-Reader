import { FaUpload } from 'react-icons/fa';

import useCommentRichEditor from '../hook/internal/useCommentRichEditor';
import { createComment } from '../service/commentService';

import BadgeIconButton from '@shared/component/button/BadgeIconButton';
import DarkButton from '@shared/component/button/DarkButton';
import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';
import { requireAuth } from '@shared/service/util/requireAuth';

type CommentInputProps = {
    placeholder: string;
    titleId: string;
    onCommentCreated?: () => void;
};

const CommentInput = ({
    placeholder,
    titleId,
    onCommentCreated,
}: CommentInputProps) => {
    const {
        textareaRef,
        addImage,
        removePlaceholder,
        addPlaceholder,
        getContent,
        clearContent,
    } = useCommentRichEditor(placeholder);

    const handleSend = async () => {
        if (!requireAuth('comentar')) return;

        const { textContent, imageContent } = getContent();

        if (!textContent && !imageContent) {
            showErrorToast('Escreva algo antes de enviar.', {
                toastId: 'empty-comment-error',
            });
            return;
        }

        try {
            await createComment({
                titleId,
                textContent: textContent ?? '',
                parentCommentId: null,
            });

            clearContent();

            showSuccessToast('Comentário enviado com sucesso.', {
                toastId: 'create-comment-success',
            });

            onCommentCreated?.();
        } catch {
            showErrorToast('Erro ao enviar comentário.', {
                toastId: 'create-comment-error',
            });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={e => e.preventDefault()}>
                <div className="text-xs border rounded-xs bg-secondary border-tertiary">
                    <div className="flex p-2">
                        <div
                            ref={textareaRef}
                            onClick={removePlaceholder}
                            onBlur={addPlaceholder}
                            contentEditable="true"
                            className="flex flex-col w-full h-full gap-2 p-2 outline-none resize-none rounded-xs bg-primary-default scrollbar-hidden min-h-[4rem]"
                        />
                    </div>
                    <div className="flex items-stretch justify-between p-2 border-t border-t-tertiary">
                        <div className="flex gap-2">
                            <BadgeIconButton onClick={addImage}>
                                <FaUpload />
                            </BadgeIconButton>
                        </div>
                        <div>
                            <DarkButton onClick={handleSend} text={'Enviar'} />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CommentInput;
