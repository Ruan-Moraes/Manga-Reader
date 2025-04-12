import { useRef, useCallback, useEffect } from 'react';

import { IoImages } from 'react-icons/io5';
import { FaUpload } from 'react-icons/fa';

import { toast } from 'react-toastify';

import IconButton from '../buttons/IconButton';

type CommentInputProps = {
  placeholder: string;
};

const CommentInput = ({ placeholder }: CommentInputProps) => {
  const textareaRef = useRef<HTMLDivElement>(null);

  const removeTextareaPlaceholder = useCallback(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const placeholderElement = textarea.querySelector('#textarea_placeholder');

    if (placeholderElement) {
      textarea.removeChild(placeholderElement);
    }
  }, [textareaRef]);

  const addTextareaPlaceholder = useCallback(() => {
    const textarea = textareaRef.current;

    if (
      textarea &&
      (textarea.innerHTML.trim() === '' || textarea.innerHTML.trim() === '<br>')
    ) {
      textarea.innerHTML = `<span class="text-tertiary" id="textarea_placeholder">${placeholder}</span>`;
    }
  }, [placeholder]);

  const handleInputChange = useCallback(() => {
    removeTextareaPlaceholder();
  }, [removeTextareaPlaceholder]);

  const createImageFileInput = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    return input;
  }, []);

  const exceedsImageLimit = useCallback(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      const images = textarea.querySelectorAll('img');

      return images.length >= 3;
    }

    return false;
  }, []);

  const isImageValid = useCallback((file: File | undefined) => {
    if (!file) {
      toast.error('Nenhum arquivo selecionado');

      return false;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 2MB');

      return false;
    }

    return true;
  }, []);

  const addImageToTextarea = useCallback(() => {
    const input = createImageFileInput();

    input.onchange = () => {
      if (exceedsImageLimit()) {
        toast.error('Você só pode adicionar até 3 imagens');

        return;
      }

      const file = input.files?.[0];

      if (!file || !isImageValid(file)) {
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        removeTextareaPlaceholder();

        const imageUrl = reader.result as string;

        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'object-cover object-center w-full rounded-sm max-h-64';

        const textarea = textareaRef.current;

        textarea!.appendChild(img);
      };

      reader.readAsDataURL(file);
    };
  }, [
    createImageFileInput,
    exceedsImageLimit,
    isImageValid,
    removeTextareaPlaceholder,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uploadImage = useCallback(() => {}, []); // TODO: logic to submit the image to the server

  useEffect(() => {
    addTextareaPlaceholder();
  }, [addTextareaPlaceholder]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="text-xs border rounded-sm bg-secondary border-tertiary">
            <div className="flex p-2">
              <div
                ref={textareaRef}
                onClick={handleInputChange}
                onBlur={addTextareaPlaceholder}
                contentEditable="true"
                className="flex flex-col w-full h-full gap-2 p-2 rounded-sm outline-none resize-none bg-primary-default scrollbar-hidden"
              ></div>
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
                <IconButton
                  onClick={() => {
                    addImageToTextarea();
                  }}
                >
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
