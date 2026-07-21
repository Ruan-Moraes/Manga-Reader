import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { getLocale } from '@shared/lib/formatters';

import type { MonthlyGrowthEntry } from '../../model/admin.types';

type Props = {
    entries: MonthlyGrowthEntry[];
};

const formatMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString(getLocale(), { month: 'short', year: '2-digit' });
};

const CustomTooltip =
    (t: TFunction) =>
    ({ active, payload }: TooltipContentProps) => {
        if (!active || !payload?.length) return null;
        const data = payload[0].payload as MonthlyGrowthEntry;

        return (
            <div className="rounded-mr-xs border border-mr-border bg-mr-surface p-3 text-mr-small shadow-mr-black">
                <p className="font-mr-bold text-mr-fg">{formatMonth(data.yearMonth)}</p>
                <p className="text-mr-accent-fg">{t('subscriptionGrowthChart.new', { count: data.newSubscriptions })}</p>
                <p className="text-mr-danger">{t('subscriptionGrowthChart.cancelled', { count: data.cancelledSubscriptions })}</p>
                <p className={data.netGrowth >= 0 ? 'text-mr-accent-fg' : 'text-mr-danger'}>
                    {t('subscriptionGrowthChart.balance', { value: `${data.netGrowth > 0 ? '+' : ''}${data.netGrowth}` })}
                </p>
            </div>
        );
    };

const SubscriptionGrowthChart = ({ entries }: Props) => {
    const { t } = useTranslation('admin');

    const data = entries.map(e => ({ ...e, label: formatMonth(e.yearMonth) }));

    return (
        <div className="rounded-mr-md border border-mr-border bg-mr-surface p-[18px]">
            <h3 className="mb-4 text-[15px] font-mr-bold text-mr-fg">{t('subscriptionGrowthChart.title')}</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--mr-border)" />
                        <XAxis dataKey="label" tick={{ fill: 'var(--mr-fg-subtle)', fontSize: 12 }} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--mr-fg-subtle)', fontSize: 12 }} tickLine={false} allowDecimals={false} />
                        <Tooltip content={CustomTooltip(t)} cursor={{ fill: 'var(--mr-accent-10)' }} />
                        <Legend wrapperStyle={{ fontSize: 12, color: 'var(--mr-fg-subtle)' }} />
                        <Bar dataKey="newSubscriptions" name={t('subscriptionGrowthChart.newLegend')} fill="var(--mr-accent)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="cancelledSubscriptions" name={t('subscriptionGrowthChart.cancelledLegend')} fill="var(--mr-danger)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SubscriptionGrowthChart;
