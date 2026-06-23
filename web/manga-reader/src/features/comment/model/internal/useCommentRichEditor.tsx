import { MutableRefObject, useCallback, useEffect, useRef } from 'react';

import useCommentEditorImages from './useCommentEditorImages';
import useEditorPlaceholder from './useEditorPlaceholder';

type UseCommentRichEditorProps = {
    placeholder: string;
    externalRef?: MutableRefObject<HTMLDivElement | null>;
};

const useCommentRichEditor = (options: UseCommentRichEditorProps | string) => {
    const placeholder = typeof options === 'string' ? options : options.placeholder;
    const externalRef = typeof options === 'object' ? options.externalRef : undefined;

    const internalRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = externalRef || internalRef;

    const { shouldShowPlaceholder, addPlaceholder, removePlaceholder } = useEditorPlaceholder(textareaRef, placeholder);
    const { setImages, addImage, updateImagesFromDOM } = useCommentEditorImages({ textareaRef, removePlaceholder });

    const getContent = useCallback((): {
        textContent: string | null;
        imageContent: string | null;
    } => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return { textContent: null, imageContent: null };
        }

        const placeholderEl = textarea.querySelector('#textarea_placeholder');
        const text = placeholderEl ? null : textarea.innerText.trim() || null;

        const imgElements = textarea.querySelectorAll('[contenteditable="false"] img');
        const imgSources = Array.from(imgElements)
            .map(img => img.getAttribute('src'))
            .filter(Boolean)
            .join(',');

        return {
            textContent: text,
            imageContent: imgSources || null,
        };
    }, [textareaRef]);

    const clearContent = useCallback(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        textarea.innerHTML = '';
        setImages([]);
        addPlaceholder();
    }, [textareaRef, addPlaceholder, setImages]);

    useEffect(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        addPlaceholder();

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (target.classList.contains('remove-img-btn')) {
                const container = target.closest('[contenteditable="false"]') as HTMLElement | null;

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
    }, [addPlaceholder, removePlaceholder, shouldShowPlaceholder, textareaRef, updateImagesFromDOM, setImages]);

    return {
        textareaRef,
        addImage,
        removePlaceholder,
        addPlaceholder,
        getContent,
        clearContent,
    };
};

export default useCommentRichEditor;
