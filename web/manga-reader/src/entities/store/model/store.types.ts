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
    /** Preço atual em centavos BRL (ex.: 3990 = R$ 39,90) */
    price?: number;
    /** Preço original riscado em centavos BRL */
    oldPrice?: number;
    /** Número total de avaliações da loja */
    ratingCount?: number;
    /** Formato do produto (ex.: "Volume único · brochura") */
    format?: string;
    /** Informação de frete/entrega */
    shipping?: string;
    /** Nota curta de destaque (ex.: "Menor preço novo") */
    note?: string;
    /** Categoria para agrupamento */
    category?: 'oficial' | 'nova' | 'usado';
    /** Loja oficial/verificada */
    official?: boolean;
    /** Monograma 1-2 letras para o logo placeholder */
    mono?: string;
    /** Cor de fundo do logo monograma */
    color?: string;
}
