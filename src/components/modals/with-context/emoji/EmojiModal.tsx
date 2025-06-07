import { useState } from 'react';

import { useEmojiModalContext } from '../../../../context/modals/emoji/useEmojiModalContext';

import BaseModal from '../../base/BaseModal';
import EmojiModalHeader from './header/EmojiModalHeader';
import EmojiModalBody from './body/EmojiModalBody';
import EmojiModalFooter from './footer/EmojiModalFooter';

const EmojiModal = () => {
    const { isEmojiModalOpen, closeEmojiModal } = useEmojiModalContext();

    const [selectedEmoji, setSelectedEmoji] = useState<HTMLImageElement | null>(
        null,
    );

    const applySelectionStyles = (imgElement: HTMLImageElement) => {
        imgElement.setAttribute('data-selected', 'true');
        imgElement.classList.remove('border-tertiary');
        imgElement.classList.add('border-quaternary-default');
    };

    const removeSelectionStyles = (imgElement: HTMLImageElement) => {
        imgElement.removeAttribute('data-selected');
        imgElement.classList.remove('border-quaternary-default');
        imgElement.classList.add('border-tertiary');
    };

    const handleEmojiClick = (clickedEmoji: HTMLImageElement) => {
        if (selectedEmoji === clickedEmoji) {
            removeSelectionStyles(clickedEmoji);

            setSelectedEmoji(null);
        }

        if (!(selectedEmoji === clickedEmoji)) {
            if (selectedEmoji) {
                removeSelectionStyles(selectedEmoji);
            }

            applySelectionStyles(clickedEmoji);

            setSelectedEmoji(clickedEmoji);
        }
    };

    return (
        <BaseModal isModalOpen={isEmojiModalOpen} closeModal={closeEmojiModal}>
            <div className="flex flex-col gap-4">
                <EmojiModalHeader />
                <EmojiModalBody onEmojiClick={handleEmojiClick} />
                <EmojiModalFooter selectedEmoji={selectedEmoji} />
            </div>
        </BaseModal>
    );
};

export default EmojiModal;
