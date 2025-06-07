import { useEffect, useRef } from 'react';
import { IoImages } from 'react-icons/io5';
import { FaUpload } from 'react-icons/fa';

import { useEmojiModalContext } from '../../../../../context/modals/emoji/useEmojiModalContext';

import useCommentChat from '../../../../../hooks/comments/internal/useCommentChat';

import EmojiModal from '../../../with-context/emoji/EmojiModal';
import IconButton from '../../../../buttons/IconButton';
import BlackButton from '../../../../buttons/BlackButton';

type EditModalBodyProps = {
    onEdit: (
        newTextContent: string | null,
        newImageContent: string | null,
    ) => void;
    onCancel: () => void;
    initialText: string | null;
    initialImages: string | null;
};

// TODO: Refatorar para usar o hook useCommentChat
const EditModalBody = ({
    onEdit,
    onCancel,
    initialText,
    initialImages,
}: EditModalBodyProps) => {
    const { textareaRef, addImage, addImageFromEmoji, removePlaceholder } =
        useCommentChat('Edite seu comentário');

    const { openEmojiModal, selectedEmoji, setSelectedEmoji } =
        useEmojiModalContext();

    const initialValuesProcessed = useRef(false);

    useEffect(() => {
        if (selectedEmoji) {
            addImageFromEmoji(selectedEmoji);

            setSelectedEmoji(null);
        }
    }, [addImageFromEmoji, selectedEmoji, setSelectedEmoji]);

    useEffect(() => {
        const textarea = textareaRef.current;

        if (textarea && !initialValuesProcessed.current) {
            initialValuesProcessed.current = true;

            if (initialText) {
                removePlaceholder();

                textarea.innerHTML = initialText;
            }

            if (initialImages) {
                removePlaceholder();

                const imageUrls = initialImages.split(',');

                imageUrls.forEach(imageUrl => {
                    if (imageUrl.trim()) {
                        const imgHTML = `
                        <div contenteditable="false" style="position: relative; display: inline-block; max-width: max-content;">
                            <img src="${imageUrl}" style="max-height: 30rem; border-radius: 0.125rem; display: block; object-fit: cover;" />
                            <button type="button" class="remove-img-btn" style="position: absolute; top: 0; right: 0; background: #f56565; color: white; font-size: 0.75rem; padding: 0.125rem 0.375rem; border: none; border-radius: 0 0.125rem 0 0.125rem; opacity: 0.75;">
                                X
                            </button>
                        </div>
                        <br/>`;

                        if (textarea.innerHTML !== '') {
                            textarea.innerHTML += imgHTML;
                        }

                        if (textarea.innerHTML === '') {
                            textarea.innerHTML = imgHTML;
                        }
                    }
                });
            }
        }
    }, [initialText, initialImages, removePlaceholder, textareaRef]);

    const handleSave = () => {
        if (textareaRef.current) {
            const newText = textareaRef.current.innerText.trim();

            const imgElements = textareaRef.current.querySelectorAll('img');
            const imgSources = Array.from(imgElements)
                .map(img => img.getAttribute('src'))
                .filter(Boolean)
                .join(',');

            onEdit(newText || null, imgSources || null);
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
                            <IconButton onClick={openEmojiModal}>
                                <IoImages />
                            </IconButton>
                            <IconButton onClick={addImage}>
                                <FaUpload />
                            </IconButton>
                        </div>
                        <div className="flex gap-2">
                            <BlackButton onClick={onCancel} text={'Cancelar'} />
                            <BlackButton onClick={handleSave} text={'Salvar'} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditModalBody;
