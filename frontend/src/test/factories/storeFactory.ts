import type { Store } from '@feature/store/type/store.types';

let storeCounter = 0;

export const buildStore = (overrides: Partial<Store> = {}): Store => {
    storeCounter += 1;

    return {
        id: `store-${storeCounter}`,
        name: `Loja Teste ${storeCounter}`,
        logo: `/logos/store-${storeCounter}.png`,
        icon: '🛒',
        description: 'Loja oficial de mangas e merchandising.',
        website: `https://loja${storeCounter}.com`,
        availability: 'in_stock',
        rating: 4.5,
        features: ['frete-gratis', 'suporte-24h'],
        ...overrides,
    };
};

export const storePresets = {
    inStock: () => buildStore({ availability: 'in_stock' }),
    outOfStock: () => buildStore({ availability: 'out_of_stock' }),
    preOrder: () => buildStore({ availability: 'pre_order' }),

    withoutRating: () => buildStore({ rating: undefined }),
    perfectRating: () => buildStore({ rating: 5 }),
    poorRating: () => buildStore({ rating: 1 }),

    withoutLogo: () => buildStore({ logo: undefined, icon: undefined }),

    minimal: () =>
        buildStore({
            logo: undefined,
            icon: undefined,
            availability: undefined,
            rating: undefined,
            features: [],
        }),

    fullFeatures: () =>
        buildStore({
            features: [
                'frete-gratis',
                'suporte-24h',
                'parcelamento',
                'troca-gratis',
                'embalagem-presente',
            ],
        }),
};

export const buildStoreList = (count = 10): Store[] =>
    Array.from({ length: count }, () => buildStore());
