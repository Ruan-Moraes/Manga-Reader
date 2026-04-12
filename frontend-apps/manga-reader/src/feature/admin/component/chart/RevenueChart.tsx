import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

import type { MonthlyRevenueEntry } from '../type/admin.types';

type Props = {
    entries: MonthlyRevenueEntry[];
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value / 100);

const formatMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
    });
};

const CustomTooltip = ({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: MonthlyRevenueEntry }>;
}) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;

    return (
        <div className="rounded-xs border border-tertiary bg-secondary p-3 text-sm shadow-lg">
            <p className="font-semibold">{formatMonth(data.yearMonth)}</p>
            <p className="text-green-400">
                Receita: {formatCurrency(data.revenue)}
            </p>
            <p className="text-tertiary">{data.count} transações</p>
            {data.growthPercent !== 0 && (
                <p
                    className={
                        data.growthPercent > 0
                            ? 'text-green-400'
                            : 'text-red-400'
                    }
                >
                    {data.growthPercent > 0 ? '+' : ''}
                    {data.growthPercent.toFixed(1)}% vs mês anterior
                </p>
            )}
        </div>
    );
};

const RevenueChart = ({ entries }: Props) => {
    const data = entries.map(e => ({
        ...e,
        label: formatMonth(e.yearMonth),
        revenueFormatted: e.revenue / 100,
    }));

    return (
        <div className="rounded-xs border border-tertiary bg-secondary p-4">
            <h3 className="mb-4 text-sm font-bold">Receita Mensal</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient
                                id="revenueGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#22c55e"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#22c55e"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickLine={false}
                            tickFormatter={v =>
                                `R$${(v as number).toLocaleString('pt-BR')}`
                            }
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenueFormatted"
                            stroke="#22c55e"
                            strokeWidth={2}
                            fill="url(#revenueGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;
