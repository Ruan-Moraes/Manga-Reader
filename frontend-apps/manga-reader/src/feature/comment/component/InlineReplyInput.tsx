import { useRef } from 'react';
import { FaUpload } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import useEasyMDE from '../hook/internal/useEasyMDE';
import { COMPACT_TOOLBAR } from '../hook/internal/useEasyMDE';
import useCommentImageUpload from '../hook/internal/useCommentImageUpload';

import BadgeIconButton from '@shared/component/button/BadgeIconButton';
import DarkButton from '@shared/component/button/DarkButton';

type InlineReplyInputProps = {
    onSubmit: (textContent: string | null, imageContent: string | null) => void;
    onCancel: () => void;
};

const InlineReplyInput = ({ onSubmit, onCancel }: InlineReplyInputProps) => {
    const { t } = useTranslation('comment');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { getValue } = useEasyMDE({
        textareaRef,
        placeholder: t('reply.placeholder'),
        minHeight: '3rem',
        toolbar: COMPACT_TOOLBAR,
    });
    const { images, addImage, removeImage } = useCommentImageUpload();

    const handleSubmit = () => {
        const trimmed = getValue().trim() || null;
        const imageContent = images.join(',') || null;
        onSubmit(trimmed, imageContent);
    };

    return (
        <div className="mt-2 text-xs border rounded-xs bg-secondary border-tertiary">
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
                    <BadgeIconButton onClick={addImage}>
                        <FaUpload />
                    </BadgeIconButton>
                </div>
                <div className="flex gap-2">
                    <DarkButton onClick={onCancel} text={t('reply.cancel')} />
                    <DarkButton onClick={handleSubmit} text={t('reply.action')} />
                </div>
            </div>
        </div>
    );
};

export default InlineReplyInput;
