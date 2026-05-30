import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import StoresContainer from './StoresContainer';

import { getStoresByTitleId } from '../service/storeService';

import { Modal } from '@ui/Modal';

import { Store } from '@features/store';

type StoresModalTypes = {
    isModalOpen: boolean;
    closeModal: () => void;
    titleId: string;
};

const StoresModal = ({ isModalOpen, closeModal, titleId }: StoresModalTypes) => {
    const { t } = useTranslation('store');
    const [stores, setStores] = useState<Store[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isModalOpen) {
            setIsLoading(true);

            getStoresByTitleId(titleId).then(data => {
                setStores(data.content);

                setIsLoading(false);
            });
        }
    }, [isModalOpen, titleId]);

    return (
        <Modal open={isModalOpen} onClose={closeModal} title={t('modal.title')} description={t('modal.subtitle')}>
            <StoresContainer stores={stores} isLoading={isLoading} />
        </Modal>
    );
};

export default StoresModal;
