import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

import type { MonthlyGrowthEntry } from '../type/admin.types';

type Props = {
    entries: MonthlyGrowthEntry[];
};

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
    payload?: Array<{ payload: MonthlyGrowthEntry }>;
}) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;

    return (
        <div className="rounded-xs border border-tertiary bg-secondary p-3 text-sm shadow-lg">
            <p className="font-semibold">{formatMonth(data.yearMonth)}</p>
            <p className="text-green-400">Novas: {data.newSubscriptions}</p>
            <p className="text-red-400">
                Canceladas: {data.cancelledSubscriptions}
            </p>
            <p
                className={
                    data.netGrowth >= 0 ? 'text-green-400' : 'text-red-400'
                }
            >
                Saldo: {data.netGrowth > 0 ? '+' : ''}
                {data.netGrowth}
            </p>
        </div>
    );
};

const SubscriptionGrowthChart = ({ entries }: Props) => {
    const data = entries.map(e => ({
        ...e,
        label: formatMonth(e.yearMonth),
    }));

    return (
        <div className="rounded-xs border border-tertiary bg-secondary p-4">
            <h3 className="mb-4 text-sm font-bold">
                Crescimento de Assinaturas
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
                        />
                        <Bar
                            dataKey="newSubscriptions"
                            name="Novas"
                            fill="#22c55e"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="cancelledSubscriptions"
                            name="Canceladas"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SubscriptionGrowthChart;
