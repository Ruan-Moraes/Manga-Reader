import {useState} from "react";

import {useEmojiModalContext} from '../../../context/modals/emoji/useEmojiModalContext';

import BaseModal from '../base/BaseModal';
import EmojiModalHeader from "./header/EmojiModalHeader";
import EmojiModalBody from './Body/EmojiModalBody';
import EmojiModalFooter from './footer/EmojiModalFooter';

const EmojiModal = () => {
    const {isEmojiModalOpen, closeEmojiModal} = useEmojiModalContext();

    const [selectedEmoji, setSelectedEmoji] = useState<HTMLImageElement | null>(null);

    const applySelectionStyles = (imgElement: HTMLImageElement) => {
        imgElement.setAttribute('data-selected', 'true');

        if (imgElement.parentElement) {
            imgElement.parentElement.classList.remove('border-tertiary');
            imgElement.parentElement.classList.add('border-quaternary-opacity-50');
        }
    };

    const removeSelectionStyles = (imgElement: HTMLImageElement) => {
        imgElement.removeAttribute('data-selected');

        if (imgElement.parentElement) {
            imgElement.parentElement.classList.remove('border-quaternary-opacity-50');
            imgElement.parentElement.classList.add('border-tertiary');
        }
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
                <EmojiModalHeader/>
                <EmojiModalBody onEmojiClick={handleEmojiClick}/>
                <EmojiModalFooter selectedEmoji={selectedEmoji}/>
            </div>
        </BaseModal>
    );
};

export default EmojiModal;