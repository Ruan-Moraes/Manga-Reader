import { useCallback, useRef } from 'react';

import { IoImages } from 'react-icons/io5';
import { FaUpload } from 'react-icons/fa';
import IconButton from '../buttons/IconButton';

type CommentInputProps = {
  placeholder: string;
};

const CommentInput = ({ placeholder }: CommentInputProps) => {
  const textareaRef = useRef<HTMLDivElement>(null);

  const handleInputChange = useCallback(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight / 16}rem`;
    }
  }, []);

  // const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
  //   if (event.key === 'Enter' && !event.shiftKey) {
  //     event.preventDefault();
  //     // Handle the submit event here
  //   }
  // }, []);

  const uploadImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = () => {
          const imageUrl = reader.result as string;
          // Todo: Add a function to handle the image URL

          // Set the image URL in the textarea

          const textarea = textareaRef.current;

          if (textarea) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = 'Uploaded Image';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '0.5rem';
            img.style.marginTop = '0.5rem';

            textarea.appendChild(img);
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight / 16}rem`;
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }, [handleInputChange]);

  // Todo: Add a function to handle the submit event and send the comment to the server

  return (
    <div className="flex flex-col gap-4">
      <div>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="text-xs border rounded-sm bg-secondary border-tertiary">
            <div className="flex p-2">
              <div
                ref={textareaRef}
                onInput={handleInputChange}
                contentEditable="true"
                className="w-full h-full p-2 rounded-sm outline-none resize-none bg-primary-default scrollbar-hidden"
              />
            </div>
            <div className="flex items-stretch justify-between p-2 border-t border-t-tertiary">
              <div className="flex gap-2">
                <IconButton
                  onClick={() => {
                    // Todo: Add a function to handle the emoji picker
                  }}
                >
                  <IoImages />
                </IconButton>
                <IconButton onClick={uploadImage}>
                  <FaUpload />
                </IconButton>
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
