import { useCallback } from 'react';

import { useEmojiModalContext } from '../../../../../context/modals/emoji/useEmojiModalContext';

import BlackButton from '../../../../buttons/BlackButton';

type EmojiModalFooterProps = {
    selectedEmoji: HTMLImageElement | null;
};

const EmojiModalFooter = ({ selectedEmoji }: EmojiModalFooterProps) => {
    const { closeEmojiModal, setSelectedEmoji } = useEmojiModalContext();

    const handleEmojiSelect = useCallback(() => {
        if (selectedEmoji) {
            setSelectedEmoji(selectedEmoji);

            closeEmojiModal();
        }
    }, [closeEmojiModal, selectedEmoji, setSelectedEmoji]);

    return (
        <div className="flex justify-end">
            <BlackButton onClick={handleEmojiSelect} text="Selecionar" />
        </div>
    );
};

export default EmojiModalFooter;
