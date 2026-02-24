import BaseModal from '@shared/component/modal/base/BaseModal';

import RatingWizard from './wizard/RatingWizard';

type RatingModalProps = {
    isModalOpen: boolean;
    closeModal: () => void;
    /* eslint-disable no-unused-vars */
    onSubmitRating: (
        rating: number,
        comment?: string,
        categoryRatings?: Record<string, number>,
    ) => void;
    /* eslint-enable no-unused-vars */
    isSubmitting?: boolean;
};

const RatingModal = ({
    isModalOpen,
    closeModal,
    onSubmitRating,
    isSubmitting = false,
}: RatingModalProps) => {
    const handleSubmit = (
        stars: number,
        comment?: string,
        categoryRatings?: Record<string, number>,
    ) => {
        onSubmitRating(stars, comment, categoryRatings);
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
