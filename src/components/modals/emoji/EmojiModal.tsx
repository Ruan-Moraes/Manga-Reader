import { useEmojiModalContext } from '../../../context/modals/emoji/useEmojiModalContext';

import BaseModal from '../base/BaseModal';
import EmojiModalHeader from './header/EmojiModalHeader';
import EmojiModalBody from './body/EmojiModalBody';

const EmojiModal = () => {
  const { isEmojiModalOpen, closeEmojiModal } = useEmojiModalContext();

  return (
    <BaseModal isModalOpen={isEmojiModalOpen} closeModal={closeEmojiModal}>
      <EmojiModalHeader />
      <EmojiModalBody />
    </BaseModal>
  );
};

export default EmojiModal;
