import type { ReactNode } from 'react';

import { getLocale } from '@shared/lib/formatters';

type MetricsCardProps = {
    label: string;
    value: number | string;
    icon?: ReactNode;
    accent?: 'default' | 'success' | 'warning' | 'danger';
};

const ACCENTS: Record<NonNullable<MetricsCardProps['accent']>, string> = {
    default: 'bg-ui-accent-25 text-ui-accent-fg',
    success: 'bg-ui-accent-25 text-ui-accent-fg',
    warning: 'bg-ui-gray-800 text-ui-fg-muted',
    danger: 'bg-ui-danger-15 text-ui-danger',
};

const VALUE_TONE: Record<NonNullable<MetricsCardProps['accent']>, string> = {
    default: 'text-ui-fg',
    success: 'text-ui-accent-fg',
    warning: 'text-ui-fg',
    danger: 'text-ui-danger',
};

const MetricsCard = ({ label, value, icon, accent = 'default' }: MetricsCardProps) => {
    const formattedValue = typeof value === 'number' ? value.toLocaleString(getLocale()) : value;

    return (
        <div className="flex items-center gap-3.5 rounded-ui-md border border-ui-border bg-ui-surface p-4">
            {icon && <div className={`flex size-11 shrink-0 items-center justify-center rounded-ui-sm ${ACCENTS[accent]}`}>{icon}</div>}
            <div>
                <p className={`text-[26px] font-ui-extrabold leading-none ${VALUE_TONE[accent]}`}>{formattedValue}</p>
                <p className="mt-1.5 text-ui-small font-ui-semibold uppercase tracking-[0.08em] text-ui-fg-subtle">{label}</p>
            </div>
        </div>
    );
};

export default MetricsCard;
