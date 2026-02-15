import { useState } from 'react';
import { IoImageOutline, IoGlobeOutline } from 'react-icons/io5';
import { FaDiscord } from 'react-icons/fa';

import { GroupTypes } from '../../../types/GroupTypes';

type GroupCardProps = {
    group: GroupTypes;
    isLoading?: boolean;
};

const GroupCard = ({ group, isLoading = false }: GroupCardProps) => {
    const [imageError, setImageError] = useState<boolean>(false);

    const handleImageError = () => {
        setImageError(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'text-green-500';
            case 'inactive':
                return 'text-red-500';
            case 'hiatus':
                return 'text-yellow-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return 'Ativo';
            case 'inactive':
                return 'Inativo';
            case 'hiatus':
                return 'Hiato';
            default:
                return 'Desconhecido';
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col w-full border rounded-xs border-tertiary">
                <div className="flex justify-center items-center h-24 mobile-md:h-32 bg-secondary">
                    <span className="font-bold text-tertiary">Carregando...</span>
                </div>
                <div className="p-2">
                    <div className="mb-1 h-3 rounded animate-pulse bg-secondary"></div>
                    <div className="mb-1 h-2 rounded animate-pulse bg-secondary"></div>
                    <div className="h-2 rounded animate-pulse bg-secondary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full border rounded-xs border-tertiary">
            {/* Logo/Header */}
            <div className="overflow-hidden relative h-24 mobile-md:h-32">
                {!imageError && group.logo ? (
                    <img
                        src={group.logo}
                        alt={`Logo do grupo: ${group.name}`}
                        onError={handleImageError}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="flex justify-center items-center w-full h-full bg-secondary">
                        <div className="flex flex-col justify-center items-center">
                            <IoImageOutline size={24} className="text-tertiary" />
                            <span className="mt-1 text-xs text-center text-tertiary">
                                Logo não disponível
                            </span>
                        </div>
                    </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-1 right-1">
                    <span className={`px-1 py-0.5 text-xs font-bold rounded bg-white ${getStatusColor(group.status)}`}>
                        {getStatusText(group.status)}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-2">
                <h3 className="mb-1 text-sm font-bold truncate">{group.name}</h3>
                
                <p className="mb-2 text-xs text-tertiary line-clamp-2">
                    {group.description}
                </p>

                {/* Stats */}
                <div className="mb-2 text-xs text-tertiary">
                    <div className="flex justify-between">
                        <span>Títulos: {group.totalTitles}</span>
                        {group.foundedYear && (
                            <span>Fundado: {group.foundedYear}</span>
                        )}
                    </div>
                </div>

                {/* Links */}
                <div className="flex gap-1">
                    {group.website && (
                        <a
                            href={group.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-1 py-0.5 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                        >
                            <IoGlobeOutline size={10} />
                            Site
                        </a>
                    )}
                    {group.discord && (
                        <a
                            href={group.discord}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-1 py-0.5 text-xs text-purple-600 border border-purple-600 rounded hover:bg-purple-50 transition-colors"
                        >
                            <FaDiscord size={10} />
                            Discord
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupCard;