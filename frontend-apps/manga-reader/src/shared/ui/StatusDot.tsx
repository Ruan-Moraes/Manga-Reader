import { cn } from '@/lib/cn';

export type StatusKind = 'operating' | 'degraded' | 'down' | 'idle';
export type StatusSize = 8 | 10 | 12;

export interface StatusDotProps {
    status: StatusKind;
    size?: StatusSize;
    pulse?: boolean;
    label?: string;
}

const colorMap: Record<StatusKind, string> = {
    operating: 'bg-mr-accent  shadow-[0_0_0_3px_rgba(221,218,42,.22)]',
    degraded: 'bg-mr-danger  shadow-[0_0_0_3px_rgba(255,120,79,.22)]',
    down: 'bg-[#FF4444]  shadow-[0_0_0_3px_rgba(255,68,68,.22)]',
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
