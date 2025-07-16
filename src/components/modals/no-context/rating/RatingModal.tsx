import { useState } from 'react';

import BaseModal from '../../base/BaseModal';
import RatingModalHeader from './header/RatingModalHeader';
import RatingModalBody from './body/RatingModalBody';
import RatingModalFooter from './footer/RatingModalFooter';

type RatingModalProps = {
    isModalOpen: boolean;
    closeModal: () => void;
    onSubmitRating: (rating: number) => void;
    isSubmitting?: boolean;
};

const RatingModal = ({
    isModalOpen,
    closeModal,
    onSubmitRating,
    isSubmitting = false,
}: RatingModalProps) => {
    const [currentRating, setCurrentRating] = useState<number>(0);

    const handleSubmit = () => {
        if (currentRating > 0) {
            onSubmitRating(currentRating);
            setCurrentRating(0);
            closeModal();
        }
    };

    const handleCancel = () => {
        setCurrentRating(0);
        closeModal();
    };

    const handleRatingChange = (rating: number) => {
        setCurrentRating(rating);
    };

    return (
        <BaseModal isModalOpen={isModalOpen} closeModal={handleCancel}>
            <RatingModalHeader title="Classificar Título" />
            <RatingModalBody onRatingChange={handleRatingChange} />
            <RatingModalFooter
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                isDisabled={currentRating === 0}
            />
        </BaseModal>
    );
};

export default RatingModal;
