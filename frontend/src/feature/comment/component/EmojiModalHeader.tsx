import { useEmojiModalContext } from '../context/useEmojiModalContext';

import BlackButton from '@shared/component/button/BlackButton';
import SearchInput from '@shared/component/input/SearchInput';

const EmojiModalHeader = () => {
    const { closeEmojiModal } = useEmojiModalContext();

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-end">
                <BlackButton onClick={closeEmojiModal} text="Fechar" />
            </div>
            <div className="flex flex-col gap-2">
                <div>
                    <h4 className="font-bold">
                        Selecione um Emoji, Sticker ou GIF
                    </h4>
                </div>
                <SearchInput placeholder={'Pesquisar Emoji, Sticker ou GIF'} />
            </div>
        </div>
    );
};

export default EmojiModalHeader;
