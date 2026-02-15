import { IoOpenOutline } from 'react-icons/io5';

import { getGroupStatusLabel } from '../../service/groupService';
import { Group } from '../../type/group.types';
import CustomLink from '@shared/component/link/element/CustomLink';

type GroupCardProps = {
    group: Group;
    isLoading?: boolean;
};

const statusColorMap = {
    active: 'bg-green-400',
    hiatus: 'bg-yellow-400',
    inactive: 'bg-red-400',
};

const GroupCard = ({ group, isLoading = false }: GroupCardProps) => {
    if (isLoading) {
        return (
            <article className="flex flex-col gap-3 p-4 border rounded-xs border-tertiary animate-pulse bg-secondary/40">
                <div className="mx-auto w-20 h-20 rounded-full bg-tertiary" />
                <div className="w-2/3 h-4 rounded-xs bg-tertiary" />
                <div className="w-full h-3 rounded-xs bg-tertiary" />
                <div className="w-1/2 h-3 rounded-xs bg-tertiary" />
            </article>
        );
    }

    return (
        <article className="flex flex-col gap-4 p-4 border rounded-xs border-tertiary bg-secondary/40 hover:-translate-y-1 hover:shadow-elevated transition-all duration-200">
            <img
                src={group.logo}
                alt={`Avatar do grupo ${group.name}`}
                className="object-cover mx-auto w-20 h-20 rounded-full border border-quaternary"
            />

            <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold text-center">
                    {group.name}
                </h3>

                <div className="flex flex-wrap gap-1 justify-center">
                    {group.genres.map(genre => (
                        <span
                            key={genre}
                            className="px-2 py-1 text-[0.65rem] border rounded-xs border-tertiary bg-primary"
                        >
                            {genre}
                        </span>
                    ))}
                </div>

                <div className="flex justify-between items-center text-xs">
                    <span className="flex gap-2 items-center">
                        <span
                            className={`h-2 w-2 rounded-full ${statusColorMap[group.status]}`}
                        />
                        {getGroupStatusLabel(group.status)}
                    </span>
                    <a
                        href={group.website}
                        target="_blank"
                        rel="noreferrer"
                        className="transition-colors text-tertiary hover:text-quaternary"
                        title="Abrir site oficial"
                    >
                        <IoOpenOutline size={14} />
                    </a>
                </div>

                <div className="flex justify-between text-xs text-tertiary">
                    <span>{group.members.length} membros</span>
                    <span>{group.totalTitles} obras</span>
                </div>

                <CustomLink
                    link={`/groups/${group.id}`}
                    text="Ver detalhes"
                    className="text-xs"
                />
            </div>
        </article>
    );
};

export default GroupCard;
