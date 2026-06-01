import { useCallback, useState } from 'react';

import { showErrorToast } from '@shared/service/util/toastService';

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const useCommentImageUpload = (initialImages?: string) => {
    const [images, setImages] = useState<string[]>(() => {
        if (!initialImages) return [];
        return initialImages
            .split(',')
            .map(u => u.trim())
            .filter(Boolean);
    });

    const addImage = useCallback(() => {
        if (images.length >= MAX_IMAGES) {
            showErrorToast('Você só pode adicionar até 3 imagens', {
                toastId: 'image-limit-error',
            });
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.click();

        input.onchange = () => {
            const file = input.files?.[0] || null;

            if (!file) {
                showErrorToast('Nenhum arquivo selecionado', {
                    toastId: 'no-file-selected-error',
                });
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                showErrorToast('O arquivo deve ter no máximo 2MB', {
                    toastId: 'file-size-error',
                });
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                const imageUrl = reader.result as string;
                setImages(prev => [...prev, imageUrl]);
            };

            reader.readAsDataURL(file);
        };
    }, [images.length]);

    const removeImage = useCallback((index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearImages = useCallback(() => {
        setImages([]);
    }, []);

    const initImages = useCallback((imageContent: string | null) => {
        if (!imageContent) return;
        const urls = imageContent
            .split(',')
            .map(u => u.trim())
            .filter(Boolean);
        setImages(urls);
    }, []);

    return {
        images,
        addImage,
        removeImage,
        clearImages,
        initImages,
    };
};

export default useCommentImageUpload;
