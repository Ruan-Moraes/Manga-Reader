import { simulateDelay } from '@shared/service/mockApi';
import { mockStores, titleStoreMap } from '@mock/data/stores';

import { type Store } from '../type/store.types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getStores = async (): Promise<Store[]> => {
    await simulateDelay();
    return mockStores;
};

export const getStoresByTitleId = async (titleId: string): Promise<Store[]> => {
    await simulateDelay();

    const storeIds = titleStoreMap[titleId] ?? [
        'store-1',
        'store-2',
        'store-3',
    ];

    return mockStores.filter(s => storeIds.includes(s.id));
};
