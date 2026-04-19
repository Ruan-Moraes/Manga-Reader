import type { ReactNode } from 'react';

type MetricsCardProps = {
    label: string;
    value: number | string;
    icon?: ReactNode;
    accent?: 'default' | 'success' | 'warning' | 'danger';
};

const ACCENTS: Record<NonNullable<MetricsCardProps['accent']>, string> = {
    default: 'bg-quaternary-opacity-25',
    success: 'bg-green-500/20 text-green-300',
    warning: 'bg-yellow-500/20 text-yellow-300',
    danger: 'bg-red-500/20 text-red-300',
};

const MetricsCard = ({
    label,
    value,
    icon,
    accent = 'default',
}: MetricsCardProps) => {
    const formattedValue =
        typeof value === 'number' ? value.toLocaleString('pt-BR') : value;

    return (
        <div className="flex items-center gap-3 p-4 border rounded-xs bg-secondary border-tertiary">
            {icon && (
                <div className={`p-2 rounded-xs ${ACCENTS[accent]}`}>
                    {icon}
                </div>
            )}
            <div>
                <p className="text-2xl font-bold">{formattedValue}</p>
                <p className="text-xs text-tertiary">{label}</p>
            </div>
        </div>
    );
};

export default MetricsCard;
