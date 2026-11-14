import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { Composer } from '@ui/Composer';

import useCommentImageUpload from '../../../model/internal/useCommentImageUpload';

type ReplyModalProps = {
    isOpen: boolean;
    onSubmit: (textContent: string | null, imageContent: string | null) => void;
    onCancel: () => void;
};

/** Resposta no mobile: composer dentro de modal (no desktop usa-se o InlineReplyInput). */
const ReplyModal = ({ isOpen, onSubmit, onCancel }: ReplyModalProps) => {
    const { t } = useTranslation('comment');

    const { images, addImage, removeImage } = useCommentImageUpload();

    return (
        <Modal open={isOpen} onClose={onCancel} title={t('reply.modalTitle')} size="md" bodyClassName="flex min-h-[45vh] flex-col">
            <Composer
                compact
                bare
                fill
                placeholder={t('reply.placeholder')}
                submitLabel={t('reply.action')}
                ariaLabel={t('reply.modalTitle')}
                onSubmit={onSubmit}
                images={images}
                onAddImage={addImage}
                onRemoveImage={removeImage}
            />
        </Modal>
    );
};

export default ReplyModal;
