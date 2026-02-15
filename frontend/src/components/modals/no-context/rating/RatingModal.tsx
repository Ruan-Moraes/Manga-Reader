import { useState } from 'react';

import BaseModal from '../../base/BaseModal';
import RatingStars from '../../../ratings/RatingStars';

type RatingModalProps = {
    isModalOpen: boolean;
    closeModal: () => void;
    onSubmitRating: (rating: number, comment?: string) => void;
    isSubmitting?: boolean;
};

const RatingModal = ({
    isModalOpen,
    closeModal,
    onSubmitRating,
    isSubmitting = false,
}: RatingModalProps) => {
    const [currentRating, setCurrentRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');

    const handleSubmit = () => {
        if (currentRating < 1) {
            return;
        }

        onSubmitRating(currentRating, comment);
        setCurrentRating(0);
        setComment('');
        closeModal();
    };

    return (
        <BaseModal isModalOpen={isModalOpen} closeModal={closeModal}>
            <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold">Avaliar mangá</h3>
                <RatingStars
                    value={currentRating}
                    onChange={setCurrentRating}
                    size={24}
                />
                <textarea
                    value={comment}
                    onChange={event => setComment(event.target.value)}
                    placeholder="Comentário (opcional)"
                    className="w-full h-24 p-2 text-sm border rounded-xs border-tertiary bg-secondary"
                />
                <div className="flex gap-2">
                    <button
                        onClick={closeModal}
                        className="flex-1 px-4 py-2 text-sm border rounded-xs border-tertiary"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={currentRating < 1 || isSubmitting}
                        className="flex-1 px-4 py-2 text-sm text-white rounded-xs bg-primary disabled:opacity-50"
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar avaliação'}
                    </button>
                </div>
            </div>
        </BaseModal>
    );
};

export default RatingModal;
