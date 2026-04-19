import BaseModal from '@shared/component/modal/base/BaseModal';

import RatingWizard from './wizard/RatingWizard';

type RatingSubmitData = {
    funRating: number;
    artRating: number;
    storylineRating: number;
    charactersRating: number;
    originalityRating: number;
    pacingRating: number;
    comment?: string;
};

type RatingModalProps = {
    isModalOpen: boolean;
    closeModal: () => void;
    onSubmitRating: (data: RatingSubmitData) => void;
    isSubmitting?: boolean;
};

const RatingModal = ({
    isModalOpen,
    closeModal,
    onSubmitRating,
    isSubmitting = false,
}: RatingModalProps) => {
    const handleSubmit = (data: RatingSubmitData) => {
        onSubmitRating(data);
        closeModal();
    };

    return (
        <BaseModal isModalOpen={isModalOpen} closeModal={closeModal}>
            <RatingWizard
                onSubmit={handleSubmit}
                onCancel={closeModal}
                isSubmitting={isSubmitting}
            />
        </BaseModal>
    );
};

export default RatingModal;
