import { useCallback, useState } from 'react';

import BaseModal from '@shared/component/modal/base/BaseModal';

import RatingModalHeader from './header/RatingModalHeader';
import RatingModalBody from './body/RatingModalBody';
import RatingModalFooter from './footer/RatingModalFooter';

type RatingModalProps = {
    isModalOpen: boolean;
    closeModal: () => void;
    onSubmitRating: (
        rating: number,
        comment?: string,
        categoryRatings?: Record<string, number>,
    ) => void;
    isSubmitting?: boolean;
};

const RatingModal = ({
    isModalOpen,
    closeModal,
    onSubmitRating,
    isSubmitting = false,
}: RatingModalProps) => {
    const [totalScore, setTotalScore] = useState<number>(0);
    const [allCategoriesRated, setAllCategoriesRated] =
        useState<boolean>(false);

    const handleRatingChange = useCallback((score: number) => {
        setTotalScore(score);
    }, []);

    const handleAllCategoriesRated = useCallback((allRated: boolean) => {
        setAllCategoriesRated(allRated);
    }, []);

    const handleSubmit = () => {
        if (!allCategoriesRated) return;

        const stars = Math.round((totalScore / 2) * 10) / 10;

        onSubmitRating(stars);
        setTotalScore(0);
        setAllCategoriesRated(false);
        closeModal();
    };

    const handleCancel = () => {
        setTotalScore(0);
        setAllCategoriesRated(false);
        closeModal();
    };

    return (
        <BaseModal isModalOpen={isModalOpen} closeModal={handleCancel}>
            <RatingModalHeader title="Avaliar mangá" />
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
