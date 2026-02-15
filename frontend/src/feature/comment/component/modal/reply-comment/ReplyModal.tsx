import { useCallback } from 'react';

import BaseModal from '@shared/component/modal/base/BaseModal';
import ReplyModalHeader from './header/ReplyModalHeader';
import ReplyModalBody from './body/ReplyModalBody';

type ReplyModalProps = {
    isOpen: boolean;

    onReply: (textContent: string | null, imageContent: string | null) => void;
    onCancel: () => void;

    title: string;
};

const ReplyModal = ({
    isOpen,

    onReply,
    onCancel,

    title,
}: ReplyModalProps) => {
    const handleReply = useCallback(
        (textContent: string | null, imageContent: string | null) => {
            onReply(textContent, imageContent);
        },
        [onReply],
    );

    const handleCancelClick = useCallback(() => {
        onCancel();
    }, [onCancel]);

    return (
        isOpen && (
            <BaseModal isModalOpen={isOpen} closeModal={handleCancelClick}>
                <div className="flex flex-col gap-2 p-2">
                    <ReplyModalHeader title={title} />
                    <ReplyModalBody
                        onReply={handleReply}
                        onCancel={handleCancelClick}
                    />
                </div>
            </BaseModal>
        )
    );
};

export default ReplyModal;
