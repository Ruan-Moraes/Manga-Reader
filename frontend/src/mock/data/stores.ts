import { type Store } from '@feature/store';

/**
 * Lojas parceiras simuladas.
 * Podem ser filtradas por titleId via mapeamento no serviço.
 */
export const mockStores: Store[] = [
    {
        id: 'store-1',
        name: 'Amazon',
        icon: 'amazon',
        description:
            'Marketplace oficial com catálogo variado e entrega rápida.',
        website: 'https://amazon.com.br',
        availability: 'in_stock',
        rating: 4.7,
        features: ['Entrega rápida', 'Prime', 'Frete grátis'],
    },
    {
        id: 'store-2',
        name: 'Panini',
        icon: 'panini',
        description:
            'Editora parceira com lançamentos frequentes e edições exclusivas.',
        website: 'https://panini.com.br',
        availability: 'in_stock',
        rating: 4.5,
        features: ['Lançamentos', 'Edições exclusivas'],
    },
    {
        id: 'store-3',
        name: 'Livraria Cultura',
        description:
            'Livraria com seção dedicada a mangás e eventos literários.',
        website: 'https://livrariacultura.com.br',
        availability: 'in_stock',
        rating: 4.3,
        features: ['Curadoria', 'Eventos'],
    },
    {
        id: 'store-4',
        name: 'JBC',
        icon: 'default',
        description: 'Editora com foco em mangás e light novels brasileiros.',
        website: 'https://editorajbc.com.br',
        availability: 'in_stock',
        rating: 4.6,
        features: ['Editora oficial', 'Assinatura mensal'],
    },
    {
        id: 'store-5',
        name: 'NewPOP',
        icon: 'default',
        description:
            'Manhwas, mangás e publicações de nicho para leitores exigentes.',
        website: 'https://newpop.com.br',
        availability: 'in_stock',
        rating: 4.4,
        features: ['Manhwa', 'Edições premium'],
    },
    {
        id: 'store-6',
        name: 'Magalu',
        icon: 'default',
        description:
            'Grande varejo online com preços competitivos e promoções.',
        website: 'https://magazineluiza.com.br',
        availability: 'in_stock',
        rating: 4.1,
        features: ['Cashback', 'Parcelamento'],
    },
    {
        id: 'store-7',
        name: 'Comix',
        icon: 'default',
        description: 'Loja especializada em mangás, HQs e colecionáveis.',
        website: 'https://comix.com.br',
        availability: 'pre_order',
        rating: 4.8,
        features: ['Colecionáveis', 'Pré-venda'],
    },
    {
        id: 'store-8',
        name: 'Shopee',
        icon: 'default',
        description:
            'Marketplace com vendedores independentes e ofertas diárias.',
        website: 'https://shopee.com.br',
        availability: 'in_stock',
        rating: 3.9,
        features: ['Frete grátis', 'Cupons'],
    },
];

/**
 * Mapeamento título → lojas disponíveis.
 * Títulos não listados retornam as 3 primeiras lojas por padrão.
 */
export const titleStoreMap: Record<string, string[]> = {
    '1': ['store-1', 'store-2', 'store-7'],
    '2': ['store-1', 'store-5', 'store-8'],
    '3': ['store-1', 'store-4', 'store-3'],
    '4': ['store-1', 'store-2', 'store-6'],
    '5': ['store-4', 'store-3', 'store-7'],
    '6': ['store-1', 'store-2', 'store-7', 'store-6'],
    '7': ['store-5', 'store-1', 'store-8'],
    '8': ['store-2', 'store-1', 'store-3'],
    '9': ['store-4', 'store-6', 'store-8'],
    '10': ['store-2', 'store-1', 'store-7'],
    '11': ['store-5', 'store-1', 'store-6'],
    '12': ['store-4', 'store-3', 'store-8'],
    '13': ['store-2', 'store-7', 'store-1'],
    '14': ['store-4', 'store-3', 'store-6'],
    '15': ['store-5', 'store-1', 'store-8'],
    '16': ['store-2', 'store-1', 'store-3'],
};
