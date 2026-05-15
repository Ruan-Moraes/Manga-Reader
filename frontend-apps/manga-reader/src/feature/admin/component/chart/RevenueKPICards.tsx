import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

import { getLocale } from '@shared/util/formatters';

import MetricsCard from '../MetricsCard';
import type { RevenueTimeSeries } from '../../type/admin.types';

type Props = {
    data: RevenueTimeSeries;
};

const formatCurrency = (valueInCents: number) =>
    new Intl.NumberFormat(getLocale(), {
        style: 'currency',
        currency: 'BRL',
    }).format(valueInCents / 100);

const RevenueKPICards = ({ data }: Props) => {
    const { t } = useTranslation('admin');
    const currentMonth = data.entries.at(-1);

    const currentRevenue = currentMonth?.revenue ?? 0;
    const growthPercent = currentMonth?.growthPercent ?? 0;

    const momLabel =
        growthPercent > 0
            ? `+${growthPercent.toFixed(1)}%`
            : `${growthPercent.toFixed(1)}%`;

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricsCard
                label={t('dashboard.financial.summary.monthRevenue')}
                value={formatCurrency(currentRevenue)}
                icon={<FiDollarSign />}
                accent="success"
            />
            <MetricsCard
                label={t('dashboard.financial.summary.monthlyVariation')}
                value={momLabel}
                icon={
                    growthPercent >= 0 ? <FiTrendingUp /> : <FiTrendingDown />
                }
                accent={growthPercent >= 0 ? 'success' : 'danger'}
            />
            <MetricsCard
                label={t('dashboard.financial.summary.annualRevenue')}
                value={formatCurrency(data.totalRevenue)}
                icon={<FiDollarSign />}
            />
        </div>
    );
};

export default RevenueKPICards;
