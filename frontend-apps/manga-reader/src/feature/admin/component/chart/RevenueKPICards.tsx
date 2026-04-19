import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';

import MetricsCard from '../MetricsCard';
import type { RevenueTimeSeries } from '../../type/admin.types';

type Props = {
    data: RevenueTimeSeries;
};

const formatCurrency = (valueInCents: number) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valueInCents / 100);

const RevenueKPICards = ({ data }: Props) => {
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
                label="Receita do Mês"
                value={formatCurrency(currentRevenue)}
                icon={<FiDollarSign />}
                accent="success"
            />
            <MetricsCard
                label="Variação Mensal"
                value={momLabel}
                icon={
                    growthPercent >= 0 ? <FiTrendingUp /> : <FiTrendingDown />
                }
                accent={growthPercent >= 0 ? 'success' : 'danger'}
            />
            <MetricsCard
                label="Receita Anual"
                value={formatCurrency(data.totalRevenue)}
                icon={<FiDollarSign />}
            />
        </div>
    );
};

export default RevenueKPICards;
