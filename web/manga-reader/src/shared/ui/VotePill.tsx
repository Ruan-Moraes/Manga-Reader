// Todo: Verificar se o proprio usuario esta tentando da up ou down, se sim, nem chamar a rota do backend. isso vale se nao estive autenticado

import { ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@shared/lib/cn';

export interface VotePillProps {
    value: number;
    active?: 'up' | 'down' | null;
    onUp?: () => void;
    onDown?: () => void;
    label?: string;
    upLabel?: string;
    downLabel?: string;
}

export const VotePill = ({ value, active = null, onUp, onDown, label, upLabel = 'Votar a favor', downLabel = 'Votar contra' }: VotePillProps) => (
    <div role="group" aria-label={label} className="inline-flex h-8 items-center gap-0.5 rounded-mr-full border border-mr-chip-border bg-mr-chip px-1">
        <button
            type="button"
            onClick={onUp}
            aria-pressed={active === 'up'}
            aria-label={upLabel}
            className={cn(
                'grid size-[1.625rem] place-items-center rounded-mr-full transition-colors hover:bg-mr-surface-elevated hover:text-mr-fg mr-focus-ring cursor-pointer',
                active === 'up' ? 'text-mr-accent-fg' : 'text-mr-fg-subtle',
            )}
        >
            <ChevronUp className="size-4" aria-hidden="true" />
        </button>
        <span
            className={cn(
                'min-w-[1.625rem] text-center text-[13px] font-mr-extrabold tabular-nums',
                active === 'up' && 'text-mr-accent-fg',
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
                'grid size-[1.625rem] place-items-center rounded-mr-full transition-colors hover:bg-mr-surface-elevated hover:text-mr-danger mr-focus-ring cursor-pointer',
                active === 'down' ? 'text-mr-danger' : 'text-mr-fg-subtle',
            )}
        >
            <ChevronDown className="size-4" aria-hidden="true" />
        </button>
    </div>
);

export default VotePill;
