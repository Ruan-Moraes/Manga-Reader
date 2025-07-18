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
    const [allCategoriesRated, setAllCategoriesRated] = useState<boolean>(false);

    const handleSubmit = () => {
        if (allCategoriesRated && currentRating > 0) {
            onSubmitRating(currentRating);
            setCurrentRating(0);
            setAllCategoriesRated(false);
            closeModal();
        }
    };

    const handleCancel = () => {
        setCurrentRating(0);
        setAllCategoriesRated(false);
        closeModal();
    };

    const handleRatingChange = (rating: number) => {
        setCurrentRating(rating);
    };

    const handleAllCategoriesRated = (allRated: boolean) => {
        setAllCategoriesRated(allRated);
    };

    return (
        <BaseModal isModalOpen={isModalOpen} closeModal={handleCancel}>
            <RatingModalHeader title="Classificar Título" />
            <RatingModalBody 
                onRatingChange={handleRatingChange} 
                onAllCategoriesRated={handleAllCategoriesRated}
            />
            <RatingModalFooter
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                isDisabled={!allCategoriesRated}
            />
        </BaseModal>
    );
};

export default RatingModal;
