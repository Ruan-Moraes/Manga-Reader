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
    live: 'bg-ui-accent',
    open: 'bg-ui-accent-75',
    soon: 'bg-ui-tertiary',
    ended: 'bg-ui-danger',
};

const toneMap: Record<StatusTone, { wrap: string; dot: string }> = {
    live: {
        wrap: 'bg-ui-accent-10 text-ui-accent-fg border-ui-accent-border',
        dot: 'bg-ui-accent',
    },
    open: {
        wrap: 'bg-ui-accent-10 text-ui-accent-fg border-ui-accent-border',
        dot: 'bg-ui-accent-75',
    },
    soon: {
        wrap: 'bg-ui-gray-800 text-ui-fg-subtle border-ui-gray-700',
        dot: 'bg-ui-tertiary',
    },
    ended: {
        wrap: 'bg-ui-danger-15 text-ui-danger border-ui-danger-border',
        dot: 'bg-ui-danger',
    },
};

export const StatusPill = ({ tone = 'soon', children }: StatusPillProps) => {
    const t = toneMap[tone];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-ui-full border px-2.5 py-[3px]',
                'text-ui-tiny font-ui-bold uppercase tracking-[0.06em]',
                t.wrap,
            )}
        >
            <span className={cn('size-[7px] shrink-0 rounded-ui-full', t.dot)} />
            {children}
        </span>
    );
};

export default StatusPill;
