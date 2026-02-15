import {
    MutableRefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import { showErrorToast } from '../../../services/utils/toastUtils';

type UseCommentChatProps = {
    placeholder: string;
    externalRef?: MutableRefObject<HTMLDivElement | null>;
};

const useCommentChat = (options: UseCommentChatProps | string) => {
    const placeholder =
        typeof options === 'string' ? options : options.placeholder;
    const externalRef =
        typeof options === 'object' ? options.externalRef : undefined;

    const internalRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = externalRef || internalRef;

    const [images, setImages] = useState<string[]>([]);

    const shouldShowPlaceholder = useCallback((): boolean => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return false;
        }

        return (
            textarea.innerHTML.trim() === '' ||
            textarea.innerHTML.trim() === '<br>' ||
            textarea.innerText.trim().length === 0
        );
    }, [textareaRef]);

    const addPlaceholder = useCallback(() => {
        const textarea = textareaRef.current;

        if (!textarea || !shouldShowPlaceholder()) {
            return;
        }

        textarea.innerHTML = `<span contenteditable="false" class="text-tertiary" id="textarea_placeholder">${placeholder}</span>`;
    }, [placeholder, shouldShowPlaceholder, textareaRef]);

    const removePlaceholder = useCallback(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        const placeholderElement = textarea.querySelector(
            '#textarea_placeholder',
        );

        if (placeholderElement) {
            placeholderElement.remove();
        }
    }, [textareaRef]);

    const updateImagesFromDOM = useCallback(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        const currentImgs = Array.from(
            textarea.querySelectorAll('[contenteditable="false"] img'),
        )
            .map(img => img.getAttribute('src'))
            .filter(Boolean) as string[];

        setImages(currentImgs);
    }, [textareaRef]);

    const exceedsImageLimit = useCallback(() => {
        if (images.length >= 3) {
            showErrorToast('Você só pode adicionar até 3 imagens', {
                toastId: 'image-limit-error',
            });

            return true;
        }

        return false;
    }, [images]);

    const isImageValid = useCallback((file: File | null) => {
        if (!file) {
            showErrorToast('Nenhum arquivo selecionado', {
                toastId: 'no-file-selected-error',
            });

            return false;
        }

        if (file.size > 2 * 1024 * 1024) {
            showErrorToast('O arquivo deve ter no máximo 2MB', {
                toastId: 'file-size-error',
            });

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
            const file = input.files?.[0] || null;

            if (!isImageValid(file)) {
                return;
            }

            if (exceedsImageLimit()) {
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                const imageUrl = reader.result as string;
                const textarea = textareaRef.current;

                if (!textarea) {
                    return;
                }

                textarea.focus();
                removePlaceholder();

                const imgHTML = `<div contenteditable="false" style="position: relative; display: inline-block; max-width: max-content;">
                                    <img src="${imageUrl}" style="max-height: 30rem; border-radius: 0.125rem; display: block; object-fit: cover;" />
                                    <button type="button" class="remove-img-btn" style="position: absolute; top: 0; right: 0; background: #f56565; color: white; font-size: 0.75rem; padding: 0.125rem 0.375rem; border: none; border-radius: 0 0.125rem 0 0.125rem; opacity: 0.75;">
                                        X
                                    </button>
                                 </div>
                                 <br/>`;

                const range = document.createRange();
                const selection = window.getSelection();

                if (selection) {
                    selection.removeAllRanges();

                    range.selectNodeContents(textarea);
                    range.collapse(false);

                    selection.addRange(range);
                }

                document.execCommand('insertHTML', false, imgHTML);

                textarea.focus();

                setTimeout(() => {
                    updateImagesFromDOM();
                }, 0);
            };

            reader.readAsDataURL(file as Blob);
        };
    }, [
        exceedsImageLimit,
        isImageValid,
        removePlaceholder,
        textareaRef,
        updateImagesFromDOM,
    ]);

    const addImageFromEmoji = useCallback(
        (emoji: HTMLImageElement | null) => {
            if (exceedsImageLimit()) {
                return;
            }

            if (!emoji) {
                showErrorToast('Nenhum emoji selecionado', {
                    toastId: 'no-emoji-selected-error',
                });

                return;
            }

            const textarea = textareaRef.current;

            if (!textarea) {
                return;
            }

            textarea.focus();
            removePlaceholder();

            const imgHTML = `<div contenteditable="false" style="position: relative; display: inline-block; max-width: max-content;">
                                    <img src="${emoji}" style="max-height: 30rem; border-radius: 0.125rem; display: block; object-fit: cover;" />
                                    <button type="button" class="remove-img-btn" style="position: absolute; top: 0; right: 0; background: #f56565; color: white; font-size: 0.75rem; padding: 0.125rem 0.375rem; border: none; border-radius: 0 0.125rem 0 0.125rem; opacity: 0.75;">
                                        X
                                    </button>
                                 </div>
                                 <br/>`;

            const range = document.createRange();
            const selection = window.getSelection();

            if (selection) {
                selection.removeAllRanges();

                range.selectNodeContents(textarea);
                range.collapse(false);

                selection.addRange(range);
            }

            document.execCommand('insertHTML', false, imgHTML);

            textarea.focus();

            setTimeout(() => {
                updateImagesFromDOM();
            }, 0);
        },
        [
            exceedsImageLimit,
            removePlaceholder,
            textareaRef,
            updateImagesFromDOM,
        ],
    );

    useEffect(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        addPlaceholder();

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (target.classList.contains('remove-img-btn')) {
                const container = target.closest(
                    '[contenteditable="false"]',
                ) as HTMLElement | null;

                if (container && textarea.contains(container)) {
                    const imgEl = container.querySelector('img');
                    const src = imgEl?.getAttribute('src');

                    if (src) {
                        setImages(prev => prev.filter(img => img !== src));
                    }

                    container.remove();

                    if (shouldShowPlaceholder()) {
                        addPlaceholder();
                    }
                }
            }
        };

        const handleInput = () => {
            updateImagesFromDOM();

            if (shouldShowPlaceholder()) {
                addPlaceholder();
            }
        };

        const handleFocus = () => {
            removePlaceholder();

            if (textarea && shouldShowPlaceholder()) {
                const range = document.createRange();
                const selection = window.getSelection();

                if (selection) {
                    selection.removeAllRanges();

                    range.setStart(textarea, 0);
                    range.collapse(true);

                    selection.addRange(range);
                }
            }
        };

        textarea.addEventListener('click', handleClick);
        textarea.addEventListener('input', handleInput);
        textarea.addEventListener('keyup', handleInput);
        textarea.addEventListener('focus', handleFocus);

        return () => {
            textarea.removeEventListener('click', handleClick);
            textarea.removeEventListener('input', handleInput);
            textarea.removeEventListener('keyup', handleInput);
            textarea.removeEventListener('focus', handleFocus);
        };
    }, [
        addPlaceholder,
        removePlaceholder,
        shouldShowPlaceholder,
        textareaRef,
        updateImagesFromDOM,
    ]);

    return {
        textareaRef,
        addImage,
        addImageFromEmoji,
        removePlaceholder,
        addPlaceholder,
    };
};

export default useCommentChat;
