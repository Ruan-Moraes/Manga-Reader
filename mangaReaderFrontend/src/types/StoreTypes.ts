export interface StoreTypes {
    id: string;
    name: string;
    logo: string;
    description: string;
    website: string;
    price: number;
    currency: string;
    availability: 'in_stock' | 'out_of_stock' | 'pre_order';
    rating: number;
    discount?: {
        percentage: number;
        originalPrice: number;
    };
    features: string[];
}
