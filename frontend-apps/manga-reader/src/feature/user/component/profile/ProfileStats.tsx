import { useTranslation } from 'react-i18next';

import { type ProfileStats as ProfileStatsType } from '../../type/user.types';

type Props = {
    stats: ProfileStatsType;
};

const ProfileStats = ({ stats }: Props) => {
    const { t } = useTranslation('user');

    const statItems = [
        { i18nKey: 'reading', value: stats.lendo },
        { i18nKey: 'wantToRead', value: stats.queroLer },
        { i18nKey: 'completed', value: stats.concluido },
        { i18nKey: 'total', value: stats.libraryTotal },
        { i18nKey: 'comments', value: stats.comments },
        { i18nKey: 'ratings', value: stats.ratings },
    ];

    return (
        <div className="grid grid-cols-3 gap-2 px-4 sm:grid-cols-6">
            {statItems.map(({ i18nKey, value }) => (
                <div
                    key={i18nKey}
                    className="flex flex-col items-center gap-1 p-3 border rounded-xs border-tertiary bg-secondary/30"
                >
                    <span className="text-xl font-bold">{value}</span>
                    <span className="text-[10px] text-tertiary text-center">
                        {t(`profile.stats.${i18nKey}`)}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default ProfileStats;
