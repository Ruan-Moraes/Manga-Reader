import {useCallback, useEffect, useRef, useState} from 'react';
import {toast} from 'react-toastify';

export function useCommentEditor(placeholder: string) {
    const textareaRef = useRef<HTMLDivElement>(null);

    const [images, setImages] = useState<string[]>([]);

    const shouldShowPlaceholder = useCallback((): boolean => {
        const textarea = textareaRef.current;

        if (!textarea) return false;

        return (
            textarea.innerHTML.trim() === '' ||
            textarea.innerHTML.trim() === '<br>' ||
            textarea.innerText.trim().length === 0
        );
    }, []);

    const addPlaceholder = useCallback(() => {
        const textarea = textareaRef.current;

        if (!textarea || !shouldShowPlaceholder()) return;

        textarea.innerHTML = `<span contenteditable="false" class="text-tertiary" id="textarea_placeholder">${placeholder}</span>`;
    }, [placeholder, shouldShowPlaceholder]);

    const removePlaceholder = useCallback(() => {
        const textarea = textareaRef.current;

        if (!textarea) return;

        const placeholderElement = textarea.querySelector('#textarea_placeholder');

        if (placeholderElement) {
            placeholderElement.remove();
        }
    }, []);

    const updateImagesFromDOM = useCallback(() => {
        const textarea = textareaRef.current;

        if (!textarea) return;

        const currentImgs = Array.from(
            textarea.querySelectorAll('[contenteditable="false"] img')
        )
            .map((img) => img.getAttribute('src'))
            .filter(Boolean) as string[];

        setImages(currentImgs);
    }, []);

    const exceedsImageLimit = useCallback(() => {
        if (images.length >= 3) {
            toast.error('Você só pode adicionar até 3 imagens');

            return true;
        }

        return false;
    }, [images]);

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

    const addImage = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.click();

        input.onchange = () => {
            const file = input.files?.[0];

            if (!isImageValid(file)) return;
            if (exceedsImageLimit()) return;

            const reader = new FileReader();

            reader.onload = () => {
                const imageUrl = reader.result as string;
                const textarea = textareaRef.current;

                if (!textarea) return;

                removePlaceholder();

                const imgHTML = `
          <div contenteditable="false" style="position: relative; display: inline-block; max-width: max-content;">
            <img src="${imageUrl}" style="max-height: 30rem; border-radius: 0.125rem; display: block; object-fit: cover;" />
            <button type="button" class="remove-img-btn" style="position: absolute; top: 0; right: 0; background: #f56565; color: white; font-size: 0.75rem; padding: 0.125rem 0.375rem; border: none; border-radius: 0 0.125rem 0 0.125rem; opacity: 0.75;">
              X
            </button>
          </div>
          <br/>
        `;

                textarea.focus();

                document.execCommand('insertHTML', false, imgHTML); // Comando "execCommand" está obsoleto, e não possui outro substituto.

                setTimeout(() => {
                    updateImagesFromDOM();
                }, 0);
            };

            reader.readAsDataURL(file as Blob);
        };
    }, [exceedsImageLimit, isImageValid, removePlaceholder, updateImagesFromDOM]);

    const addImageFromEmoji = useCallback((emoji: HTMLImageElement | null) => {
        if (exceedsImageLimit()) return;

        if (!emoji) {
            toast.error('Nenhum emoji selecionado');

            return;
        }

        const textarea = textareaRef.current;

        if (!textarea) return;

        removePlaceholder();

        const imgHTML = `
          <div contenteditable="false" style="position: relative; display: inline-block; max-width: 100%;">
            <img src="${emoji.src}" style="max-height: 30rem; border-radius: 0.125rem; display: block; object-fit: cover;" />
            <button type="button" class="remove-img-btn" style="position: absolute; top: 0; right: 0; background: #f56565; color: white; font-size: 0.75rem; padding: 0.125rem 0.375rem; border: none; border-radius: 0 0.125rem 0 0.125rem; opacity: 0.75;">
              X
            </button>
          </div>
          <br/>
        `;

        textarea.focus();

        document.execCommand('insertHTML', false, imgHTML); // Comando "execCommand" está obsoleto, e não possui outro substituto.

        setTimeout(() => {
            updateImagesFromDOM();
        }, 0);
    }, [exceedsImageLimit, removePlaceholder, updateImagesFromDOM]);

    useEffect(() => {
        const textarea = textareaRef.current;

        if (!textarea) return;

        addPlaceholder();

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (target.classList.contains('remove-img-btn')) {
                const container = target.closest(
                    '[contenteditable="false"]'
                ) as HTMLElement | null;

                if (container && textarea.contains(container)) {
                    const imgEl = container.querySelector('img');
                    const src = imgEl?.getAttribute('src');

                    if (src) {
                        setImages((prev) => prev.filter((img) => img !== src));
                    }

                    container.remove();

                    if (shouldShowPlaceholder()) addPlaceholder();
                }
            }
        };

        const handleInput = () => {
            updateImagesFromDOM();

            if (shouldShowPlaceholder()) addPlaceholder();
        };

        textarea.addEventListener('click', handleClick);
        textarea.addEventListener('input', handleInput);
        textarea.addEventListener('keyup', handleInput);

        return () => {
            textarea.removeEventListener('click', handleClick);
            textarea.removeEventListener('input', handleInput);
            textarea.removeEventListener('keyup', handleInput);
        };
    }, [
        addPlaceholder,
        removePlaceholder,
        updateImagesFromDOM,
        shouldShowPlaceholder,
    ]);

    return {
        textareaRef,
        addImage,
        addImageFromEmoji,
        handleInputChange: removePlaceholder,
        handleBlur: addPlaceholder,
    };
}
