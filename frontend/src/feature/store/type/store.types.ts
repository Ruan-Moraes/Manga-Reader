export interface Store {
    id: string;
    name: string;
    logo?: string;
    icon?: string;
    description: string;
    website: string;
    availability?: 'in_stock' | 'out_of_stock' | 'pre_order';
    rating?: number;
    features: string[];
}
