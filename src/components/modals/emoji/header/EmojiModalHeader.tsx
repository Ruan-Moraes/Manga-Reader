import { useEmojiModalContext } from '../../../../context/modals/emoji/useEmojiModalContext';

import BlackButton from '../../../buttons/BlackButton';

const EmojiModalHeader = () => {
  const { closeEmojiModal } = useEmojiModalContext();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <BlackButton onClick={closeEmojiModal} text="Fechar" />
      </div>
      <div>
        <h4 className="font-bold">Selecione um Emoji, Sticker ou GIF</h4>
      </div>
    </div>
  );
};

export default EmojiModalHeader;
