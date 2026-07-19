import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

import type { MonthlyRevenueEntry } from '../../model/admin.types';

type Props = {
    entries: MonthlyRevenueEntry[];
};

const formatCurrency = (value: number, locale: string) =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'BRL',
    }).format(value / 100);

const formatMonth = (yearMonth: string, locale: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString(locale, {
        month: 'short',
        year: '2-digit',
    });
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: MonthlyRevenueEntry }> }) => {
    const { t, i18n } = useTranslation('admin');
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;

    return (
        <div className="rounded-mr-xs border border-mr-border bg-mr-surface p-3 text-mr-small shadow-mr-black">
            <p className="font-mr-bold text-mr-fg">{formatMonth(data.yearMonth, i18n.language)}</p>
            <p className="text-mr-accent-fg">
                {t('revenueChart.revenue', {
                    value: formatCurrency(data.revenue, i18n.language),
                })}
            </p>
            <p className="text-mr-fg-subtle">{t('revenueChart.transactions', { count: data.count })}</p>
            {data.growthPercent !== 0 && (
                <p className={data.growthPercent > 0 ? 'text-mr-accent-fg' : 'text-mr-danger'}>
                    {t('revenueChart.growthVsPrevious', {
                        value: `${data.growthPercent > 0 ? '+' : ''}${data.growthPercent.toFixed(1)}`,
                    })}
                </p>
            )}
        </div>
    );
};

const RevenueChart = ({ entries }: Props) => {
    const { t, i18n } = useTranslation('admin');
    const data = entries.map(e => ({
        ...e,
        label: formatMonth(e.yearMonth, i18n.language),
        revenueFormatted: e.revenue / 100,
    }));

    return (
        <div className="rounded-mr-md border border-mr-border bg-mr-surface p-[18px]">
            <h3 className="mb-4 text-[15px] font-mr-bold text-mr-fg">{t('revenueChart.title')}</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--mr-accent)" stopOpacity={0.12} />
                                <stop offset="95%" stopColor="var(--mr-accent)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--mr-border)" />
                        <XAxis dataKey="label" tick={{ fill: 'var(--mr-fg-subtle)', fontSize: 12 }} tickLine={false} />
                        <YAxis
                            tick={{ fill: 'var(--mr-fg-subtle)', fontSize: 12 }}
                            tickLine={false}
                            tickFormatter={v => `R$${(v as number).toLocaleString(i18n.language)}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--mr-tertiary)' }} />
                        <Area type="monotone" dataKey="revenueFormatted" stroke="var(--mr-accent-border)" strokeWidth={2} fill="url(#revenueGradient)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;
