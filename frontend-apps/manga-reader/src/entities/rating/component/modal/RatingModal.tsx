import { useTranslation } from 'react-i18next';
import { Modal } from '@ui/Modal';

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

const RatingModal = ({ isModalOpen, closeModal, onSubmitRating, isSubmitting = false }: RatingModalProps) => {
    const { t } = useTranslation('rating');

    const handleSubmit = (data: RatingSubmitData) => {
        onSubmitRating(data);
        closeModal();
    };

    return (
        <Modal open={isModalOpen} onClose={closeModal} title={t('wizard.title')}>
            <RatingWizard onSubmit={handleSubmit} onCancel={closeModal} isSubmitting={isSubmitting} />
        </Modal>
    );
};

export default RatingModal;
