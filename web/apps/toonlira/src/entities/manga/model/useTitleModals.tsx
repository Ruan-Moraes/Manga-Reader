import { useCallback, useState } from 'react';

const useTitleModals = () => {
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);

    const openRatingModal = useCallback(() => setIsRatingModalOpen(true), []);
    const closeRatingModal = useCallback(() => setIsRatingModalOpen(false), []);

    const openGroupsModal = useCallback(() => setIsGroupsModalOpen(true), []);
    const closeGroupsModal = useCallback(() => setIsGroupsModalOpen(false), []);

    const openCartModal = useCallback(() => setIsCartModalOpen(true), []);
    const closeCartModal = useCallback(() => setIsCartModalOpen(false), []);

    return {
        isRatingModalOpen,
        isGroupsModalOpen,
        isCartModalOpen,
        openRatingModal,
        closeRatingModal,
        openGroupsModal,
        closeGroupsModal,
        openCartModal,
        closeCartModal,
    };
};

export default useTitleModals;
