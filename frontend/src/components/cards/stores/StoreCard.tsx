import React from 'react';
import {
    IoLogoAmazon,
    IoOpenOutline,
    IoStorefrontOutline,
} from 'react-icons/io5';
import { SiBookmeter } from 'react-icons/si';

import { StoreTypes } from '../../../types/StoreTypes';

interface StoreCardProps {
    store: StoreTypes;
    isLoading: boolean;
}

const StoreCard: React.FC<StoreCardProps> = ({ store, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex gap-2 p-3 border border-tertiary rounded-xs bg-secondary animate-pulse">
                <div className="w-10 h-10 rounded-full bg-tertiary"></div>
                <div className="flex-1">
                    <div className="w-1/2 h-3 mb-2 rounded bg-tertiary"></div>
                    <div className="w-2/3 h-3 rounded bg-tertiary"></div>
                </div>
            </div>
        );
    }

    const iconMap: Record<string, React.ReactNode> = {
        amazon: <IoLogoAmazon className="text-2xl" />,
        panini: <SiBookmeter className="text-xl" />,
        default: <IoStorefrontOutline className="text-2xl" />,
    };

    return (
        <a
            href={store.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 border rounded-xs border-tertiary bg-secondary/50 hover:bg-secondary transition-all hover:translate-x-0.5"
        >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-default border border-tertiary">
                {iconMap[store.icon || 'default'] ?? iconMap.default}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold truncate">{store.name}</h3>
                <p className="text-xs text-tertiary">{store.description}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold">
                <span>Acessar</span>
                <IoOpenOutline size={14} />
            </div>
        </a>
    );
};

export default StoreCard;
