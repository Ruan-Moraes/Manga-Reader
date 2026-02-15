import React from 'react';
import { StoreTypes } from '../../../types/StoreTypes';
import StoreCard from './StoreCard';

interface StoresContainerProps {
    stores: StoreTypes[];
    isLoading: boolean;
    title?: string;
}

const StoresContainer: React.FC<StoresContainerProps> = ({ stores, isLoading, title }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                {title && (
                    <h2 className="text-lg font-bold">{title}</h2>
                )}
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <StoreCard
                            key={index}
                            store={{} as StoreTypes}
                            isLoading={true}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!stores || stores.length === 0) {
        return (
            <div className="flex flex-col gap-4">
                {title && (
                    <h2 className="text-lg font-bold">{title}</h2>
                )}
                <div className="flex items-center justify-center p-4 border border-dashed border-tertiary rounded-xs">
                    <p className="text-tertiary text-center text-sm">
                        Nenhuma loja encontrada vendendo esta obra.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {title && (
                <h2 className="text-lg font-bold">{title}</h2>
            )}
            <div className="flex flex-col gap-2">
                {stores.map((store) => (
                    <StoreCard
                        key={store.id}
                        store={store}
                        isLoading={false}
                    />
                ))}
            </div>
        </div>
    );
};

export default StoresContainer;