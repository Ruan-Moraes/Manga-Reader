import { MutableRefObject, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { showErrorToast } from '@shared/service/util/toastService';

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type UseCommentEditorImagesProps = {
    textareaRef: MutableRefObject<HTMLDivElement | null>;
    removePlaceholder: () => void;
};

/**
 * Handles image insertion/validation/removal for the rich comment editor.
 * Extracted from useCommentRichEditor to keep each hook focused (DT-25.3).
 */
const useCommentEditorImages = ({ textareaRef, removePlaceholder }: UseCommentEditorImagesProps) => {
    const { t } = useTranslation('comment');
    const [images, setImages] = useState<string[]>([]);

    const updateImagesFromDOM = useCallback(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        const currentImgs = Array.from(textarea.querySelectorAll('[contenteditable="false"] img'))
            .map(img => img.getAttribute('src'))
            .filter(Boolean) as string[];

        setImages(currentImgs);
    }, [textareaRef]);

    const exceedsImageLimit = useCallback(() => {
        if (images.length >= MAX_IMAGES) {
            showErrorToast(t('editor.imageLimitError'), {
                toastId: 'image-limit-error',
            });

            return true;
        }

        return false;
    }, [images, t]);

    const isImageValid = useCallback(
        (file: File | null) => {
            if (!file) {
                showErrorToast(t('editor.noFileError'), {
                    toastId: 'no-file-selected-error',
                });

                return false;
            }

            if (file.size > MAX_IMAGE_BYTES) {
                showErrorToast(t('editor.fileSizeError'), {
                    toastId: 'file-size-error',
                });

                return false;
            }

            return true;
        },
        [t],
    );

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
                                    <button type="button" class="remove-img-btn" style="position: absolute; top: 0; right: 0; background: var(--mr-danger); color: var(--mr-on-overlay); font-size: 0.75rem; padding: 0.125rem 0.375rem; border: none; border-radius: 0 0.125rem 0 0.125rem; opacity: 0.75;">
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
    }, [exceedsImageLimit, isImageValid, removePlaceholder, textareaRef, updateImagesFromDOM]);

    return { images, setImages, addImage, updateImagesFromDOM };
};

export default useCommentEditorImages;
