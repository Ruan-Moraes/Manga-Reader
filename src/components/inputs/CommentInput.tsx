import { IoImages } from 'react-icons/io5';
import { FaUpload } from 'react-icons/fa';

import { useCommentEditor } from '../../hooks/useCommentEditor';
import { useEmojiModalContext } from '../../context/modals/emoji/useEmojiModalContext';

import IconButton from '../buttons/IconButton';
import EmojiModal from '../modals/emoji/EmojiModal';

type CommentInputProps = {
  placeholder: string;
};

const CommentInput = ({ placeholder }: CommentInputProps) => {
  const { textareaRef, addImage, handleInputChange, handleBlur } =
    useCommentEditor(placeholder);

  const { openEmojiModal } = useEmojiModalContext();

  return (
    <>
      <EmojiModal />
      <div className="flex flex-col gap-4">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="text-xs border rounded-xs bg-secondary border-tertiary">
            <div className="flex p-2">
              <div
                ref={textareaRef}
                onClick={handleInputChange}
                onBlur={handleBlur}
                contentEditable="true"
                className="flex flex-col w-full h-full gap-2 p-2 outline-none resize-none rounded-xs bg-primary-default scrollbar-hidden"
              />
            </div>
            <div className="flex items-stretch justify-between p-2 border-t border-t-tertiary">
              <div className="flex gap-2">
                <IconButton
                  onClick={() => {
                    openEmojiModal();
                  }}
                >
                  <IoImages />
                </IconButton>
                <IconButton onClick={addImage}>
                  <FaUpload />
                </IconButton>
              </div>
              <div>
                <button
                  type="submit"
                  className="px-3 py-2 text-xs transition-colors duration-300 rounded-xs bg-primary-default hover:bg-quaternary-opacity-25"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CommentInput;
