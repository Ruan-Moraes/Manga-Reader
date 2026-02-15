import { useState, useEffect } from 'react';
import { StoreTypes } from '../../../../types/StoreTypes';
import BaseModal from '../../base/BaseModal';
import StoresContainer from '../../../cards/stores/StoresContainer';

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
    const [stores, setStores] = useState<StoreTypes[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dados mockados para demonstração
    const mockStores: StoreTypes[] = [
        {
            id: '1',
            name: 'Amazon Brasil',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
            description: 'A maior loja online do mundo',
            website: 'https://amazon.com.br',
            price: 29.9,
            currency: 'BRL',
            availability: 'in_stock',
            rating: 4.5,
            discount: {
                percentage: 15,
                originalPrice: 35.2,
            },
            features: ['Frete grátis', 'Prime'],
        },
        {
            id: '2',
            name: 'Submarino',
            logo: 'https://logoeps.com/wp-content/uploads/2013/03/submarino-vector-logo.png',
            description: 'Loja online brasileira',
            website: 'https://submarino.com.br',
            price: 32.5,
            currency: 'BRL',
            availability: 'in_stock',
            rating: 4.2,
            features: ['Cartão próprio'],
        },
        {
            id: '3',
            name: 'Saraiva',
            logo: 'https://logoeps.com/wp-content/uploads/2013/03/saraiva-vector-logo.png',
            description: 'Livraria tradicional brasileira',
            website: 'https://saraiva.com.br',
            price: 28.9,
            currency: 'BRL',
            availability: 'pre_order',
            rating: 4.0,
            features: ['Loja física', 'Clube de livros'],
        },
        {
            id: '4',
            name: 'Americanas',
            logo: 'https://logoeps.com/wp-content/uploads/2013/03/americanas-vector-logo.png',
            description: 'Rede varejista brasileira',
            website: 'https://americanas.com.br',
            price: 31.9,
            currency: 'BRL',
            availability: 'out_of_stock',
            rating: 3.8,
            features: ['Loja física', 'Cartão próprio'],
        },
    ];

    useEffect(() => {
        if (isModalOpen) {
            setIsLoading(true);

            setTimeout(() => {
                setStores(mockStores);

                setIsLoading(false);
            }, 1000);
        }
    }, [isModalOpen, titleId]);

    return (
        <BaseModal isModalOpen={isModalOpen} closeModal={closeModal}>
            <div>
                <div className="flex items-center justify-between pb-2 border-b border-tertiary">
                    <div>
                        <h2 className="text-lg font-bold">Onde Comprar</h2>
                    </div>
                    <div>
                        <button
                            onClick={closeModal}
                            className="text-tertiary hover:text-primary transition-colors"
                            aria-label="Fechar modal"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 max-h-80 overflow-y-auto">
                    <StoresContainer
                        stores={stores}
                        isLoading={isLoading}
                        title=""
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-tertiary">
                    <button
                        onClick={closeModal}
                        className="px-3 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </BaseModal>
    );
};

export default StoresModal;
