import { useEffect, useRef } from 'react';
import { IoImages } from 'react-icons/io5';
import { FaUpload } from 'react-icons/fa';

import { useEmojiModalContext } from '../../../../context/useEmojiModalContext';

import useCommentRichEditor from '../../../../hook/internal/useCommentRichEditor';

import EmojiModal from '../../../EmojiModal';
import BadgeIconButton from '@shared/component/button/BadgeIconButton';
import DarkButton from '@shared/component/button/DarkButton';

type ReplyModalBodyProps = {
    onReply: (textContent: string | null, imageContent: string | null) => void;
    onCancel: () => void;
};

const ReplyModalBody = ({ onReply, onCancel }: ReplyModalBodyProps) => {
    const replyTextareaRef = useRef<HTMLDivElement | null>(null);
    const { textareaRef, addImage, addImageFromEmoji } = useCommentRichEditor({
        placeholder: 'Escreva sua resposta',
        externalRef: replyTextareaRef,
    });

    const { openEmojiModal, selectedEmoji, setSelectedEmoji } =
        useEmojiModalContext();

    useEffect(() => {
        if (selectedEmoji) {
            addImageFromEmoji(selectedEmoji);

            setSelectedEmoji(null);
        }
    }, [addImageFromEmoji, selectedEmoji, setSelectedEmoji]);

    const handleSave = () => {
        if (textareaRef.current) {
            const newText = textareaRef.current.innerText.trim();

            const imgElements = textareaRef.current.querySelectorAll('img');
            const imgSources = Array.from(imgElements)
                .map(img => img.getAttribute('src'))
                .filter(Boolean)
                .join(',');

            onReply(newText || null, imgSources || null);
        }
    };

    return (
        <>
            <EmojiModal />
            <div className="flex flex-col gap-4">
                <div className="text-xs border rounded-xs bg-secondary border-tertiary">
                    <div className="flex p-2">
                        <div
                            ref={textareaRef}
                            contentEditable="true"
                            className="flex flex-col w-full h-full gap-2 p-2 outline-none resize-none rounded-xs bg-primary-default scrollbar-hidden"
                        />
                    </div>
                    <div className="flex items-stretch justify-between p-2 border-t border-t-tertiary">
                        <div className="flex gap-2">
                            <BadgeIconButton onClick={openEmojiModal}>
                                <IoImages />
                            </BadgeIconButton>
                            <BadgeIconButton onClick={addImage}>
                                <FaUpload />
                            </BadgeIconButton>
                        </div>
                        <div className="flex gap-2">
                            <DarkButton onClick={onCancel} text="Cancelar" />
                            <DarkButton onClick={handleSave} text="Responder" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReplyModalBody;
