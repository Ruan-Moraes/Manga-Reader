import { useContext } from 'react';

import { EmojiModalContext } from './EmojiModalContext';

export const useEmojiModalContext = () => {
    const context = useContext(EmojiModalContext);

    if (!context) {
        throw new Error(
            'useEmojiModal deve ser usado dentro de um EmojiModalProvider',
        );
    }

    return context;
};
