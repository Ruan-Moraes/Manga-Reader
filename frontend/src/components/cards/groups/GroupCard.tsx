import { useState } from 'react';
import { IoImageOutline } from 'react-icons/io5';

import { GroupTypes } from '../../../types/GroupTypes';
import CustomLink from '../../links/elements/CustomLink';

type GroupCardProps = {
    group: GroupTypes;
    isLoading?: boolean;
};

const GroupCard = ({ group, isLoading = false }: GroupCardProps) => {
    const [imageError, setImageError] = useState<boolean>(false);

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
                    <span className="font-bold text-tertiary">
                        Carregando...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <article className="flex flex-col w-full overflow-hidden border rounded-xs border-tertiary hover:shadow-md transition-shadow">
            <div className="overflow-hidden relative h-24 mobile-md:h-32">
                {!imageError && group.logo ? (
                    <img
                        src={group.logo}
                        alt={`Logo do grupo: ${group.name}`}
                        onError={() => setImageError(true)}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="flex justify-center items-center w-full h-full bg-secondary">
                        <IoImageOutline size={24} className="text-tertiary" />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1 p-2">
                <h3 className="text-sm font-bold truncate">{group.name}</h3>
                <p className="text-xs text-tertiary line-clamp-2">
                    {group.description}
                </p>
                <p className="text-xs">
                    {getStatusText(group.status)} · {group.members.length}{' '}
                    membros
                </p>
                <CustomLink
                    link={`/groups/${group.id}`}
                    text="Ver perfil"
                    className="text-xs"
                />
            </div>
        </article>
    );
};

export default GroupCard;
