import React from 'react';
import { useTranslation } from 'react-i18next';

import StoreCard from './StoreCard';

import { Store } from '@feature/store';

interface StoresContainerProps {
    stores: Store[];
    isLoading: boolean;
    title?: string;
}

const StoresContainer: React.FC<StoresContainerProps> = ({
    stores,
    isLoading,
    title,
}) => {
    const { t } = useTranslation('store');

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <StoreCard
                        key={index}
                        store={{} as Store}
                        isLoading={true}
                    />
                ))}
            </div>
        );
    }

    if (!stores.length) {
        return (
            <p className="text-sm text-tertiary">{t('container.empty')}</p>
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
