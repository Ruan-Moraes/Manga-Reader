import React from 'react';
import { StoreTypes } from '../../../types/StoreTypes';
import StoreCard from './StoreCard';

interface StoresContainerProps {
    stores: StoreTypes[];
    isLoading: boolean;
    title?: string;
}

const StoresContainer: React.FC<StoresContainerProps> = ({
    stores,
    isLoading,
    title,
}) => {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <StoreCard
                        key={index}
                        store={{} as StoreTypes}
                        isLoading={true}
                    />
                ))}
            </div>
        );
    }

    if (!stores.length) {
        return (
            <p className="text-sm text-tertiary">Nenhum parceiro disponível.</p>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {title && <h2 className="text-lg font-bold">{title}</h2>}
            {stores.map(store => (
                <StoreCard key={store.id} store={store} isLoading={false} />
            ))}
        </div>
    );
};

export default StoresContainer;
