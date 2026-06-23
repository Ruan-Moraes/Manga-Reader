import { MutableRefObject, useCallback } from 'react';

/**
 * Manages the contenteditable placeholder span for the rich comment editor.
 * Kept separate from image handling so each concern stays small (DT-25.3).
 */
const useEditorPlaceholder = (textareaRef: MutableRefObject<HTMLDivElement | null>, placeholder: string) => {
    const shouldShowPlaceholder = useCallback((): boolean => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return false;
        }

        return textarea.innerHTML.trim() === '' || textarea.innerHTML.trim() === '<br>' || textarea.innerText.trim().length === 0;
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

        const placeholderElement = textarea.querySelector('#textarea_placeholder');

        if (placeholderElement) {
            placeholderElement.remove();
        }
    }, [textareaRef]);

    return { shouldShowPlaceholder, addPlaceholder, removePlaceholder };
};

export default useEditorPlaceholder;
