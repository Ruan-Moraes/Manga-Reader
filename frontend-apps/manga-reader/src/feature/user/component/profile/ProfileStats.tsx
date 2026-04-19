import { type ProfileStats as ProfileStatsType } from '../../type/user.types';

type Props = {
    stats: ProfileStatsType;
};

const statItems = (stats: ProfileStatsType) => [
    { label: 'Lendo', value: stats.lendo },
    { label: 'Quero Ler', value: stats.queroLer },
    { label: 'Concluido', value: stats.concluido },
    { label: 'Total', value: stats.libraryTotal },
    { label: 'Comentarios', value: stats.comments },
    { label: 'Avaliacoes', value: stats.ratings },
];

const ProfileStats = ({ stats }: Props) => {
    return (
        <div className="grid grid-cols-3 gap-2 px-4 sm:grid-cols-6">
            {statItems(stats).map(({ label, value }) => (
                <div
                    key={label}
                    className="flex flex-col items-center gap-1 p-3 border rounded-xs border-tertiary bg-secondary/30"
                >
                    <span className="text-xl font-bold">{value}</span>
                    <span className="text-[10px] text-tertiary text-center">
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default ProfileStats;
