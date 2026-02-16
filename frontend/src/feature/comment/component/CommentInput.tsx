import { useEffect } from 'react';
import { IoImages } from 'react-icons/io5';
import { FaUpload } from 'react-icons/fa';

import { useEmojiModalContext } from '../context/useEmojiModalContext';

import useCommentRichEditor from '../hook/internal/useCommentRichEditor';

import EmojiModal from './EmojiModal';
import BadgeIconButton from '@shared/component/button/BadgeIconButton';
import DarkButton from '@shared/component/button/DarkButton';

type CommentInputProps = {
    placeholder: string;
};

const CommentInput = ({ placeholder }: CommentInputProps) => {
    const {
        textareaRef,
        addImage,
        addImageFromEmoji,
        removePlaceholder,
        addPlaceholder,
    } = useCommentRichEditor(placeholder);

    const { openEmojiModal, selectedEmoji, setSelectedEmoji } =
        useEmojiModalContext();

    useEffect(() => {
        if (selectedEmoji) {
            addImageFromEmoji(selectedEmoji);

            setSelectedEmoji(null);
        }
    }, [addImageFromEmoji, selectedEmoji, setSelectedEmoji]);

    return (
        <>
            <EmojiModal />
            <div className="flex flex-col gap-4">
                <form onSubmit={e => e.preventDefault()}>
                    <div className="text-xs border rounded-xs bg-secondary border-tertiary">
                        <div className="flex p-2">
                            <div
                                ref={textareaRef}
                                onClick={removePlaceholder}
                                onBlur={addPlaceholder}
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
                            <div>
                                <DarkButton
                                    onClick={() => {}}
                                    text={'Enviar'}
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};

export default CommentInput;
