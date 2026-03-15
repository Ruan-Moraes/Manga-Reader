import { useRef } from 'react';
import { FaUpload } from 'react-icons/fa';

import useCommentRichEditor from '../hook/internal/useCommentRichEditor';

import BadgeIconButton from '@shared/component/button/BadgeIconButton';
import DarkButton from '@shared/component/button/DarkButton';

type InlineReplyInputProps = {
    onSubmit: (textContent: string | null, imageContent: string | null) => void;
    onCancel: () => void;
};

const InlineReplyInput = ({ onSubmit, onCancel }: InlineReplyInputProps) => {
    const replyRef = useRef<HTMLDivElement | null>(null);
    const {
        textareaRef,
        addImage,
        removePlaceholder,
        addPlaceholder,
        getContent,
    } = useCommentRichEditor({
        placeholder: 'Escreva sua resposta...',
        externalRef: replyRef,
    });

    const handleSubmit = () => {
        const { textContent, imageContent } = getContent();
        onSubmit(textContent, imageContent);
    };

    return (
        <div className="mt-2 text-xs border rounded-xs bg-secondary border-tertiary">
            <div className="flex p-2">
                <div
                    ref={textareaRef}
                    onClick={removePlaceholder}
                    onBlur={addPlaceholder}
                    contentEditable="true"
                    className="flex flex-col w-full h-full gap-2 p-2 outline-none resize-none rounded-xs bg-primary-default scrollbar-hidden min-h-[3rem]"
                />
            </div>
            <div className="flex items-stretch justify-between p-2 border-t border-t-tertiary">
                <div className="flex gap-2">
                    <BadgeIconButton onClick={addImage}>
                        <FaUpload />
                    </BadgeIconButton>
                </div>
                <div className="flex gap-2">
                    <DarkButton onClick={onCancel} text="Cancelar" />
                    <DarkButton onClick={handleSubmit} text="Responder" />
                </div>
            </div>
        </div>
    );
};

export default InlineReplyInput;
