import BaseModal from '../base/BaseModal';

import { useEmojiModalContext } from '../../../context/modals/emoji/useEmojiModalContext';

const EmojiModal = () => {
  const { isEmojiModalOpen, closeEmojiModal } = useEmojiModalContext();

  return (
    <BaseModal isModalOpen={isEmojiModalOpen} closeModal={closeEmojiModal}>
      <div>
        <div>
          <h4>Selecione um Emoji</h4>
        </div>
      </div>
    </BaseModal>
  );
};

export default EmojiModal;
