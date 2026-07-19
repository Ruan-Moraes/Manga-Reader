import { cn } from '@shared/lib/cn';

export type StatusKind = 'operating' | 'degraded' | 'down' | 'idle';
export type StatusSize = 8 | 10 | 12;

export interface StatusDotProps {
    status: StatusKind;
    size?: StatusSize;
    pulse?: boolean;
    label?: string;
}

const colorMap: Record<StatusKind, string> = {
    operating: 'bg-mr-accent [box-shadow:0_0_0_3px_var(--mr-accent-25)]',
    degraded: 'bg-mr-danger [box-shadow:0_0_0_3px_var(--mr-danger-surface)]',
    down: 'bg-mr-status-down [box-shadow:0_0_0_3px_var(--mr-danger-surface)]',
    idle: 'bg-mr-tertiary',
};

const labelMap: Record<StatusKind, string> = {
    operating: 'Operando',
    degraded: 'Degradado',
    down: 'Indisponível',
    idle: 'Em espera',
};

export const StatusDot = ({ status, size = 10, pulse, label }: StatusDotProps) => {
    const shouldPulse = pulse ?? status === 'degraded';

    return (
        <span
            role="status"
            aria-label={label ?? labelMap[status]}
            className={cn('inline-block shrink-0 rounded-mr-full', colorMap[status], shouldPulse && 'animate-mr-pulse')}
            style={{ width: size, height: size }}
        />
    );
};

export default StatusDot;
