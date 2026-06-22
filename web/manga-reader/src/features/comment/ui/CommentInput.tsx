import { useTranslation } from 'react-i18next';

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';
import { requireAuth } from '@shared/service/util/requireAuth';
import { Composer } from '@ui/Composer';

import { createComment } from '@entities/comment';

import useCommentImageUpload from '../model/internal/useCommentImageUpload';

type CommentInputProps = {
    placeholder: string;
    targetId: string;
    targetType: string;
    onCommentCreated?: () => void;
};

const CommentInput = ({ placeholder, targetId, targetType, onCommentCreated }: CommentInputProps) => {
    const { t } = useTranslation('comment');

    const { images, addImage, removeImage, clearImages } = useCommentImageUpload();

    const handleSubmit = async (textContent: string | null, imageContent: string | null) => {
        if (!requireAuth(t('validation.loginRequired'))) {
            throw new Error('unauthenticated');
        }

        if (!textContent && !imageContent) {
            showErrorToast(t('validation.empty'), { toastId: 'empty-comment-error' });

            throw new Error('empty');
        }

        try {
            await createComment({
                targetType,
                targetId,
                textContent: textContent ?? '',
                imageContent,
                parentCommentId: null,
            });

            clearImages();

            showSuccessToast(t('toast.created'), { toastId: 'create-comment-success' });

            onCommentCreated?.();
        } catch (error) {
            showErrorToast(t('toast.createError'), { toastId: 'create-comment-error' });

            throw error;
        }
    };

    return <Composer placeholder={placeholder} onSubmit={handleSubmit} images={images} onAddImage={addImage} onRemoveImage={removeImage} />;
};

export default CommentInput;
