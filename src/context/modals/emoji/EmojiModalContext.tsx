import {createContext, ReactNode, useCallback, useState} from 'react';

type EmojiModalContextType = {
    isEmojiModalOpen: boolean;

    openEmojiModal: () => void;
    closeEmojiModal: () => void;

    selectedEmoji: HTMLImageElement | null;
    setSelectedEmoji: (emoji: HTMLImageElement | null) => void;
};

const EmojiModalContext = createContext<EmojiModalContextType | undefined>(undefined);

const EmojiModalProvider = ({children}: { children: ReactNode }) => {
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);

    const [selectedEmojiState, setSelectedEmojiState] = useState<HTMLImageElement | null>(null);

    const openEmojiModal = useCallback(() => setIsEmojiModalOpen(true), []);

    const closeEmojiModal = useCallback(() => setIsEmojiModalOpen(false), []);

    const setSelectedEmoji = useCallback((emoji: HTMLImageElement | null) => {
        setSelectedEmojiState(emoji);
    }, []);

    return (
        <EmojiModalContext.Provider value={{
            isEmojiModalOpen,
            openEmojiModal,
            closeEmojiModal,
            selectedEmoji: selectedEmojiState,
            setSelectedEmoji
        }}>
            {children}
        </EmojiModalContext.Provider>
    );
};

export {EmojiModalContext, EmojiModalProvider};