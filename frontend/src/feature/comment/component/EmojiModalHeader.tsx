import { useEmojiModalContext } from '../context/useEmojiModalContext';

import DarkButton from '@shared/component/button/DarkButton';
import InlineSearchInput from '@shared/component/input/InlineSearchInput';

const EmojiModalHeader = () => {
    const { closeEmojiModal } = useEmojiModalContext();

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-end">
                <DarkButton onClick={closeEmojiModal} text="Fechar" />
            </div>
            <div className="flex flex-col gap-2">
                <div>
                    <h4 className="font-bold">
                        Selecione um Emoji, Sticker ou GIF
                    </h4>
                </div>
                <InlineSearchInput
                    placeholder={'Pesquisar Emoji, Sticker ou GIF'}
                />
            </div>
        </div>
    );
};

export default EmojiModalHeader;
