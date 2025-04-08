import { useCallback, useRef } from 'react';

import { FaImage } from 'react-icons/fa';
import { HiMiniGif } from 'react-icons/hi2';

type CommentInputProps = {
  placeholder: string;
};

const CommentInput = ({ placeholder }: CommentInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = useCallback(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight / 16}rem`;
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="text-xs border rounded-sm bg-secondary border-tertiary">
            <div className="flex p-2">
              <textarea
                ref={textareaRef}
                placeholder={placeholder}
                className="w-full h-full p-2 rounded-sm outline-none resize-none bg-primary-default scrollbar-hidden"
                onInput={handleInputChange}
              />
            </div>
            <div className="flex items-stretch justify-between p-2 border-t border-t-tertiary">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded-sm bg-primary-default"
                >
                  <HiMiniGif />
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-sm bg-primary-default"
                >
                  <FaImage />
                </button>
              </div>
              <div>
                <button
                  type="submit"
                  className="px-3 py-2 text-xs transition-colors duration-300 rounded-sm bg-primary-default hover:bg-quaternary-opacity-25"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentInput;
