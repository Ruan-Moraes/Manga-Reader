import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

/**
 * Tom de status disciplinado (sem arco-íris): accent + neutros + coral.
 * - live  = accent      → em andamento / acontecendo agora / concluído (pgto) / ativo
 * - open  = accent-75   → inscrições abertas / reembolsado / hiato (grupo)
 * - soon  = tertiary    → em breve / hiato / pendente / expirada / inativo
 * - ended = danger      → encerrado / cancelado / falhou / banido
 */
export type StatusTone = 'live' | 'open' | 'soon' | 'ended';

export interface StatusPillProps {
    tone?: StatusTone;
    children: ReactNode;
}

/** Classe de preenchimento (bg) por tom — para dots de distribuição/legenda. */
export const toneFillClass: Record<StatusTone, string> = {
    live: 'bg-mr-accent',
    open: 'bg-mr-accent-75',
    soon: 'bg-mr-tertiary',
    ended: 'bg-mr-danger',
};

const toneMap: Record<StatusTone, { wrap: string; dot: string }> = {
    live: {
        wrap: 'bg-[rgba(221,218,42,0.15)] text-mr-accent border-[rgba(221,218,42,0.45)]',
        dot: 'bg-mr-accent',
    },
    open: {
        wrap: 'bg-mr-accent-10 text-mr-accent-75 border-[rgba(221,218,42,0.30)]',
        dot: 'bg-mr-accent-75',
    },
    soon: {
        wrap: 'bg-mr-gray-800 text-mr-fg-subtle border-mr-gray-700',
        dot: 'bg-mr-tertiary',
    },
    ended: {
        wrap: 'bg-mr-danger-15 text-mr-danger border-[rgba(255,120,79,0.38)]',
        dot: 'bg-mr-danger',
    },
};

export const StatusPill = ({ tone = 'soon', children }: StatusPillProps) => {
    const t = toneMap[tone];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-mr-full border px-2.5 py-[3px]',
                'text-mr-tiny font-mr-bold uppercase tracking-[0.06em]',
                t.wrap,
            )}
        >
            <span className={cn('size-[7px] shrink-0 rounded-mr-full', t.dot)} />
            {children}
        </span>
    );
};

export default StatusPill;
