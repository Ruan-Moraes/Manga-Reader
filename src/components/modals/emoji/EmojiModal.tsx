import { useEmojiModalContext } from '../../../context/modals/emoji/useEmojiModalContext';

import BaseModal from '../base/BaseModal';
import EmojiModalHeader from './Header/EmojiModalHeader';
import EmojiModalBody from './Body/EmojiModalBody';
import EmojiModalFooter from './Footer/EmojiModalFooter';

const EmojiModal = () => {
  const { isEmojiModalOpen, closeEmojiModal } = useEmojiModalContext();

  const emojiSelected = (e: HTMLImageElement) => {
    e.setAttribute('data-selected', 'true');

    e.parentElement!.classList.remove('border-tertiary');
    e.parentElement!.classList.add('border-quaternary-default');
  };

  const onClose = (e: HTMLImageElement) => {
    e.removeAttribute('data-selected');

    e.parentElement!.classList.remove('border-quaternary-default');

    e.parentElement!.classList.add('border-tertiary');
  };

  return (
    <BaseModal isModalOpen={isEmojiModalOpen} closeModal={closeEmojiModal}>
      <div className="flex flex-col gap-2">
        <EmojiModalHeader />
        <EmojiModalBody onClick={emojiSelected} onClose={onClose} />
        <EmojiModalFooter />
      </div>
    </BaseModal>
  );
};

export default EmojiModal;
