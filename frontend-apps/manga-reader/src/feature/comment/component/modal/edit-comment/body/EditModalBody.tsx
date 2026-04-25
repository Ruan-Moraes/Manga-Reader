import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUpload } from 'react-icons/fa';

import useEasyMDE from '../../../../hook/internal/useEasyMDE';
import useCommentImageUpload from '../../../../hook/internal/useCommentImageUpload';

import BadgeIconButton from '@shared/component/button/BadgeIconButton';

type EditModalBodyProps = {
    onEdit: (
        newTextContent: string | null,
        newImageContent: string | null,
    ) => void;
    onCancel: () => void;
    initialText: string | null;
    initialImages: string | null;
};

const EditModalBody = ({
    onEdit,
    onCancel,
    initialText,
    initialImages,
}: EditModalBodyProps) => {
    const { t } = useTranslation('comment');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { getValue } = useEasyMDE({
        textareaRef,
        placeholder: t('edit.placeholder'),
        initialValue: initialText ?? '',
        minHeight: '4rem',
    });
    const { images, addImage, removeImage } = useCommentImageUpload(
        initialImages ?? undefined,
    );

    const handleSave = () => {
        const trimmed = getValue().trim() || null;
        const imageContent = images.join(',') || null;
        onEdit(trimmed, imageContent);
    };

    return (
        <div className="flex flex-col gap-4">
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
                                    alt={t('edit.imageAlt', { index: i + 1 })}
                                    className="object-cover rounded-xs max-h-[10rem]"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="absolute top-0 right-0 px-1.5 py-0.5 text-xs text-white bg-red-500 rounded-bl-xs rounded-tr-xs opacity-75 hover:opacity-100 cursor-pointer"
                                >
                                    {t('edit.removeImage')}
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
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm border rounded-xs border-tertiary bg-tertiary hover:bg-secondary hover:border-secondary transition-colors cursor-pointer"
                        >
                            {t('edit.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-4 py-2 text-sm text-white border rounded-xs bg-primary border-primary hover:bg-primary/80 transition-colors cursor-pointer"
                        >
                            {t('edit.save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditModalBody;
