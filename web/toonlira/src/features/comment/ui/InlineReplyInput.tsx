import { useTranslation } from 'react-i18next';

import { Composer } from '@ui/Composer';

import useCommentImageUpload from '../model/internal/useCommentImageUpload';

type InlineReplyInputProps = {
    onSubmit: (textContent: string | null, imageContent: string | null) => void;
    onCancel: () => void;
};

const InlineReplyInput = ({ onSubmit, onCancel }: InlineReplyInputProps) => {
    const { t } = useTranslation('comment');

    const { images, addImage, removeImage } = useCommentImageUpload();

    return (
        <Composer
            compact
            placeholder={t('reply.placeholder')}
            submitLabel={t('reply.action')}
            onSubmit={onSubmit}
            onCancel={onCancel}
            images={images}
            onAddImage={addImage}
            onRemoveImage={removeImage}
        />
    );
};

export default InlineReplyInput;
