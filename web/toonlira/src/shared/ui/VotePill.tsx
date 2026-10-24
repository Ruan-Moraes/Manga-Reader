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
    <div role="group" aria-label={label} className="inline-flex h-8 items-center gap-0.5 rounded-ui-full border border-ui-chip-border bg-ui-chip px-1">
        <button
            type="button"
            onClick={onUp}
            aria-pressed={active === 'up'}
            aria-label={upLabel}
            className={cn(
                'grid size-[1.625rem] place-items-center rounded-ui-full transition-colors hover:bg-ui-surface-elevated hover:text-ui-fg ui-focus-ring cursor-pointer',
                active === 'up' ? 'text-ui-accent-fg' : 'text-ui-fg-subtle',
            )}
        >
            <ChevronUp className="size-4" aria-hidden="true" />
        </button>
        <span
            className={cn(
                'min-w-[1.625rem] text-center text-[13px] font-ui-extrabold tabular-nums',
                active === 'up' && 'text-ui-accent-fg',
                active === 'down' && 'text-ui-danger',
                !active && 'text-ui-fg',
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
                'grid size-[1.625rem] place-items-center rounded-ui-full transition-colors hover:bg-ui-surface-elevated hover:text-ui-danger ui-focus-ring cursor-pointer',
                active === 'down' ? 'text-ui-danger' : 'text-ui-fg-subtle',
            )}
        >
            <ChevronDown className="size-4" aria-hidden="true" />
        </button>
    </div>
);

export default VotePill;
