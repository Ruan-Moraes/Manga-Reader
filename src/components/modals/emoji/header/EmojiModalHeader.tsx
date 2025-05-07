import { useEmojiModalContext } from '../../../../context/modals/emoji/useEmojiModalContext';

import CloseButton from '../../share/buttons/CloseButton';

const EmojiModalHeader = () => {
  const { closeEmojiModal } = useEmojiModalContext();

  return (
    <div className="pb-2 border-b border-b-tertiary">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="italic font-bold leading-none">Selecione um Emoji</h4>
        </div>
        <div>
          <CloseButton onClick={closeEmojiModal} text="fechar" />
        </div>
      </div>
    </div>
  );
};

export default EmojiModalHeader;
