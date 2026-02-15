import { IoOpenOutline, IoPeopleOutline } from 'react-icons/io5';

import { getGroupStatusLabel } from '../../../services/mock/mockGroupService';
import { GroupTypes } from '../../../types/GroupTypes';

type GroupHeaderProps = {
    group: GroupTypes;
    onOpenMembers: () => void;
};

const statusClassMap = {
    active: 'text-green-300 border-green-300/40',
    hiatus: 'text-yellow-300 border-yellow-300/40',
    inactive: 'text-red-300 border-red-300/40',
};

const GroupHeader = ({ group, onOpenMembers }: GroupHeaderProps) => {
    return (
        <section className="overflow-hidden border rounded-xs border-tertiary bg-secondary/40">
            <div className="relative h-40 mobile-lg:h-52">
                <img
                    src={group.banner}
                    alt={`Banner do grupo ${group.name}`}
                    className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent" />
            </div>

            <div className="relative p-4 -mt-12">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="flex gap-4 items-end">
                        <img
                            src={group.logo}
                            alt={`Avatar de ${group.name}`}
                            className="object-cover w-20 h-20 rounded-full border-2 border-quaternary"
                        />

                        <div>
                            <h2 className="text-2xl font-bold">{group.name}</h2>
                            <span
                                className={`inline-flex mt-1 px-2 py-1 text-xs border rounded-xs ${statusClassMap[group.status]}`}
                            >
                                {getGroupStatusLabel(group.status)}
                            </span>
                        </div>
                    </div>

                    <a
                        href={group.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex gap-2 items-center text-sm text-tertiary transition-colors hover:text-quaternary"
                    >
                        Site oficial <IoOpenOutline />
                    </a>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-sm mobile-lg:grid-cols-4">
                    <button
                        onClick={onOpenMembers}
                        className="flex gap-2 justify-center items-center p-2 border rounded-xs border-tertiary hover:border-quaternary transition-colors"
                    >
                        <IoPeopleOutline />
                        {group.members.length} membros
                    </button>
                    <div className="p-2 text-center border rounded-xs border-tertiary">
                        {group.totalTitles} obras
                    </div>
                    <div className="p-2 text-center border rounded-xs border-tertiary">
                        ⭐ {group.rating.toFixed(1)}
                    </div>
                    <div className="p-2 text-center border rounded-xs border-tertiary">
                        🔥 {group.popularity}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GroupHeader;
