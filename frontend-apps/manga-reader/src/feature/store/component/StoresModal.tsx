import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import StoresContainer from './StoresContainer';

import { getStoresByTitleId } from '../service/storeService';

import BaseModal from '@shared/component/modal/base/BaseModal';

import { Store } from '@feature/store';

type StoresModalTypes = {
    isModalOpen: boolean;
    closeModal: () => void;
    titleId: string;
};

const StoresModal = ({
    isModalOpen,
    closeModal,
    titleId,
}: StoresModalTypes) => {
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
        <BaseModal isModalOpen={isModalOpen} closeModal={closeModal}>
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-lg font-bold">{t('modal.title')}</h2>
                    <p className="text-xs text-tertiary">
                        {t('modal.subtitle')}
                    </p>
                </div>
                <StoresContainer stores={stores} isLoading={isLoading} />
            </div>
        </BaseModal>
    );
};

export default StoresModal;
