import { ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@shared/lib/cn';

export interface VotePillProps {
    /** Placar líquido já calculado (curtidas − descurtidas). */
    value: number;
    /** Reação ativa do usuário. */
    active?: 'up' | 'down' | null;
    onUp?: () => void;
    onDown?: () => void;
    /** Rótulo acessível do grupo (ex.: "Votar — comentário"). */
    label?: string;
    upLabel?: string;
    downLabel?: string;
}

/**
 * Controle de engajamento canônico — idêntico em comentários e resenhas.
 * Totalmente controlado: exibe `value`/`active` e delega cliques. Sem estado interno.
 */
export const VotePill = ({
    value,
    active = null,
    onUp,
    onDown,
    label,
    upLabel = 'Votar a favor',
    downLabel = 'Votar contra',
}: VotePillProps) => (
    <div role="group" aria-label={label} className="inline-flex h-8 items-center gap-0.5 rounded-mr-full border border-mr-chip-border bg-mr-chip px-1">
        <button
            type="button"
            onClick={onUp}
            aria-pressed={active === 'up'}
            aria-label={upLabel}
            className={cn(
                'grid size-[1.625rem] place-items-center rounded-mr-full transition-colors hover:bg-white/5 hover:text-mr-fg mr-focus-ring',
                active === 'up' ? 'text-mr-accent' : 'text-mr-fg-subtle',
            )}
        >
            <ChevronUp className="size-4" aria-hidden="true" />
        </button>
        <span
            className={cn(
                'min-w-[1.625rem] text-center text-[13px] font-mr-extrabold tabular-nums',
                active === 'up' && 'text-mr-accent',
                active === 'down' && 'text-mr-danger',
                !active && 'text-mr-fg',
            )}
        >
            {value}
        </span>
        <button
            type="button"
            onClick={onDown}
            aria-pressed={active === 'down'}
            aria-label={downLabel}
            className={cn(
                'grid size-[1.625rem] place-items-center rounded-mr-full transition-colors hover:bg-white/5 hover:text-mr-danger mr-focus-ring',
                active === 'down' ? 'text-mr-danger' : 'text-mr-fg-subtle',
            )}
        >
            <ChevronDown className="size-4" aria-hidden="true" />
        </button>
    </div>
);

export default VotePill;
