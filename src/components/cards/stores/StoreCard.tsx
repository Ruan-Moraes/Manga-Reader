import React, { useState } from 'react';
import { StoreTypes } from '../../../types/StoreTypes';
import { IoImageOutline, IoOpenOutline, IoStar, IoCarOutline } from 'react-icons/io5';

interface StoreCardProps {
    store: StoreTypes;
    isLoading: boolean;
}

const StoreCard: React.FC<StoreCardProps> = ({ store, isLoading }) => {
    const [imageError, setImageError] = useState(false);

    if (isLoading) {
        return (
            <div className="flex gap-2 p-2 border border-tertiary rounded-xs bg-secondary animate-pulse">
                <div className="w-12 h-12 bg-tertiary rounded-xs flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                    <div className="h-4 bg-tertiary rounded mb-1"></div>
                    <div className="h-3 bg-tertiary rounded mb-1 w-3/4"></div>
                    <div className="h-3 bg-tertiary rounded w-1/2"></div>
                </div>
                <div className="w-16 h-8 bg-tertiary rounded"></div>
            </div>
        );
    }

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency === 'BRL' ? 'BRL' : 'USD'
        }).format(price);
    };

    const getAvailabilityColor = (availability: string) => {
        switch (availability) {
            case 'in_stock':
                return 'text-green-500';
            case 'out_of_stock':
                return 'text-red-500';
            case 'pre_order':
                return 'text-yellow-500';
            default:
                return 'text-tertiary';
        }
    };

    const getAvailabilityText = (availability: string) => {
        switch (availability) {
            case 'in_stock':
                return 'Em estoque';
            case 'out_of_stock':
                return 'Esgotado';
            case 'pre_order':
                return 'Pré-venda';
            default:
                return 'Indisponível';
        }
    };

    return (
        <div className="flex gap-2 p-2 border border-tertiary rounded-xs bg-secondary hover:bg-tertiary/10 transition-colors">
            {/* Logo da loja */}
            <div className="w-12 h-12 flex-shrink-0">
                {!imageError ? (
                    <img
                        src={store.logo}
                        alt={`Logo ${store.name}`}
                        className="w-full h-full object-cover rounded-xs"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-tertiary rounded-xs flex items-center justify-center">
                        <IoImageOutline size={16} className="text-primary" />
                    </div>
                )}
            </div>

            {/* Informações da loja */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-medium text-primary truncate">{store.name}</h3>
                    <div className="flex items-center gap-1 ml-2">
                        <IoStar size={10} className="text-yellow-500" />
                        <span className="text-xs text-tertiary">{store.rating.toFixed(1)}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${getAvailabilityColor(store.availability)}`}>
                        {getAvailabilityText(store.availability)}
                    </span>
                    {store.deliveryTime && (
                        <div className="flex items-center gap-1">
                            <IoCarOutline size={10} className="text-tertiary" />
                            <span className="text-xs text-tertiary">{store.deliveryTime}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        {store.discount ? (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-tertiary line-through">
                                    {formatPrice(store.discount.originalPrice, store.currency)}
                                </span>
                                <span className="text-xs font-bold text-green-600">
                                    -{store.discount.percentage}%
                                </span>
                            </div>
                        ) : null}
                        <span className="text-sm font-bold text-primary">
                            {formatPrice(store.price, store.currency)}
                        </span>
                        {store.shippingCost > 0 && (
                            <span className="text-xs text-tertiary">
                                + {formatPrice(store.shippingCost, store.currency)} frete
                            </span>
                        )}
                    </div>
                    
                    <a
                        href={store.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors"
                        disabled={store.availability === 'out_of_stock'}
                    >
                        <span>Comprar</span>
                        <IoOpenOutline size={10} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default StoreCard;