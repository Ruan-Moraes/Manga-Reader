import { useState, useEffect } from 'react';
import { Store } from '../type/store.types';
import BaseModal from '@shared/component/modal/base/BaseModal';
import StoresContainer from './StoresContainer';
import { getStoresByTitleId } from '../service/storeService';

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
    const [stores, setStores] = useState<Store[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isModalOpen) {
            setIsLoading(true);

            getStoresByTitleId(titleId).then(data => {
                setStores(data);
                setIsLoading(false);
            });
        }
    }, [isModalOpen, titleId]);

    return (
        <BaseModal isModalOpen={isModalOpen} closeModal={closeModal}>
            <div className="flex flex-col gap-4">
                <div className="pb-2 border-b border-tertiary">
                    <h2 className="text-lg font-bold">Onde Comprar</h2>
                    <p className="text-xs text-tertiary">
                        Escolha uma loja parceira e siga para o site oficial.
                    </p>
                </div>
                <StoresContainer stores={stores} isLoading={isLoading} />
            </div>
        </BaseModal>
    );
};

export default StoresModal;
