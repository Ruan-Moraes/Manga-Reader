import type { ReactNode } from 'react';

import { getLocale } from '@shared/lib/formatters';

type MetricsCardProps = {
    label: string;
    value: number | string;
    icon?: ReactNode;
    accent?: 'default' | 'success' | 'warning' | 'danger';
};

const ACCENTS: Record<NonNullable<MetricsCardProps['accent']>, string> = {
    default: 'bg-mr-accent-25 text-mr-accent',
    success: 'bg-mr-accent-25 text-mr-accent',
    warning: 'bg-mr-gray-800 text-mr-fg-muted',
    danger: 'bg-mr-danger-15 text-mr-danger',
};

const VALUE_TONE: Record<NonNullable<MetricsCardProps['accent']>, string> = {
    default: 'text-mr-fg',
    success: 'text-mr-accent',
    warning: 'text-mr-fg',
    danger: 'text-mr-danger',
};

const MetricsCard = ({ label, value, icon, accent = 'default' }: MetricsCardProps) => {
    const formattedValue = typeof value === 'number' ? value.toLocaleString(getLocale()) : value;

    return (
        <div className="flex items-center gap-3.5 rounded-mr-md border border-mr-border bg-mr-surface p-4">
            {icon && <div className={`flex size-11 shrink-0 items-center justify-center rounded-mr-sm ${ACCENTS[accent]}`}>{icon}</div>}
            <div>
                <p className={`text-[26px] font-mr-extrabold leading-none ${VALUE_TONE[accent]}`}>{formattedValue}</p>
                <p className="mt-1.5 text-mr-small font-mr-semibold uppercase tracking-[0.08em] text-mr-fg-subtle">{label}</p>
            </div>
        </div>
    );
};

export default MetricsCard;
