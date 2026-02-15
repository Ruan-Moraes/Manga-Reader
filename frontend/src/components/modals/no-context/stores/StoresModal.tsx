import { useState, useEffect } from 'react';
import { StoreTypes } from '../../../../types/StoreTypes';
import BaseModal from '../../base/BaseModal';
import StoresContainer from '../../../cards/stores/StoresContainer';

type StoresModalTypes = {
    isModalOpen: boolean;
    closeModal: () => void;
    titleId: string;
};

const mockStores: StoreTypes[] = [
    {
        id: '1',
        name: 'Amazon',
        icon: 'amazon',
        description: 'Marketplace oficial com catálogo variado.',
        website: 'https://amazon.com.br',
        features: ['Entrega rápida'],
    },
    {
        id: '2',
        name: 'Panini',
        icon: 'panini',
        description: 'Editora parceira com lançamentos frequentes.',
        website: 'https://panini.com.br',
        features: ['Lançamentos'],
    },
    {
        id: '3',
        name: 'Livraria Cultura',
        description: 'Livraria com seção dedicada a mangás.',
        website: 'https://livrariacultura.com.br',
        features: ['Curadoria'],
    },
];

const StoresModal = ({
    isModalOpen,
    closeModal,
    titleId,
}: StoresModalTypes) => {
    const [stores, setStores] = useState<StoreTypes[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isModalOpen) {
            setIsLoading(true);

            setTimeout(() => {
                setStores(mockStores);
                setIsLoading(false);
            }, 500);
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
