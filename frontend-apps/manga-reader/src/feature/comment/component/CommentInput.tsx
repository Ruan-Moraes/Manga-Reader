import { useRef } from 'react';
import { FaUpload } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import useEasyMDE from '../hook/internal/useEasyMDE';
import useCommentImageUpload from '../hook/internal/useCommentImageUpload';
import { createComment } from '../service/commentService';

import BadgeIconButton from '@shared/component/button/BadgeIconButton';
import DarkButton from '@shared/component/button/DarkButton';
import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';
import { requireAuth } from '@shared/service/util/requireAuth';

type CommentInputProps = {
    placeholder: string;
    titleId: string;
    onCommentCreated?: () => void;
};

const CommentInput = ({
    placeholder,
    titleId,
    onCommentCreated,
}: CommentInputProps) => {
    const { t } = useTranslation('comment');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { getValue, clearValue } = useEasyMDE({
        textareaRef,
        placeholder,
        minHeight: '4rem',
    });
    const { images, addImage, removeImage, clearImages } =
        useCommentImageUpload();

    const handleSend = async () => {
        if (!requireAuth(t('validation.loginRequired'))) return;

        const trimmed = getValue().trim();
        const imageContent = images.join(',') || null;

        if (!trimmed && !imageContent) {
            showErrorToast(t('validation.empty'), {
                toastId: 'empty-comment-error',
            });
            return;
        }

        try {
            await createComment({
                titleId,
                textContent: trimmed || '',
                parentCommentId: null,
            });

            clearValue();
            clearImages();

            showSuccessToast(t('toast.created'), {
                toastId: 'create-comment-success',
            });

            onCommentCreated?.();
        } catch {
            showErrorToast(t('toast.createError'), {
                toastId: 'create-comment-error',
            });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={e => e.preventDefault()}>
                <div className="text-xs border rounded-xs bg-secondary border-tertiary">
                    <div className="p-2">
                        <textarea ref={textareaRef} />
                    </div>
                    {images.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-2 pb-2">
                            {images.map((src, i) => (
                                <div key={i} className="relative inline-block">
                                    <img
                                        src={src}
                                        alt={t('actions.imageAlt', { index: i + 1 })}
                                        className="object-cover rounded-xs max-h-[10rem]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        aria-label={t('actions.removeImage')}
                                        className="absolute top-0 right-0 px-1.5 py-0.5 text-xs text-white bg-red-500 rounded-bl-xs rounded-tr-xs opacity-75 hover:opacity-100 cursor-pointer"
                                    >
                                        X
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-stretch justify-between p-2 border-t border-t-tertiary">
                        <div className="flex items-center gap-2">
                            <BadgeIconButton
                                onClick={addImage}
                                className="h-full w-full"
                            >
                                <FaUpload />
                            </BadgeIconButton>
                        </div>
                        <div>
                            <DarkButton onClick={handleSend} text={t('actions.send')} />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CommentInput;
