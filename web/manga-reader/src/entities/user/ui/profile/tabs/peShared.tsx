import { type ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

/**
 * Estilos do modal de edição de perfil, em classes Tailwind (tokens `mr-*` de
 * `styles/index.css`). Migrado de `style` inline para Tailwind conforme a regra de
 * styling do CLAUDE.md — inline fica reservado a valores dinâmicos de runtime.
 */

// Input padrão (altura fixa).
export const peInput =
    'box-border h-10 w-full rounded-mr-xs border border-mr-gray-700 bg-mr-secondary px-3 font-mr-sans text-[13px] tracking-mr text-mr-fg outline-none';

// Input "nu" para uso dentro de um grupo com prefixo (sem borda/fundo próprios).
export const peInputBare = 'h-full w-full border-0 bg-transparent px-3 font-mr-sans text-[13px] tracking-mr text-mr-fg outline-none';

export const peIntro = 'mb-[18px] text-mr-small leading-relaxed text-mr-gray-200';

export const peSmallBtn = (kind: 'ghost' | 'danger') =>
    cn(
        'cursor-pointer rounded-mr-xs border bg-transparent px-2.5 py-1.5 text-mr-tiny font-mr-bold tracking-mr',
        kind === 'danger' ? 'border-mr-danger text-mr-danger' : 'border-mr-tertiary text-mr-fg',
    );

export const peEyebrow = (tone: 'accent' | 'muted' = 'accent') =>
    cn('mb-2 text-mr-tiny font-mr-extrabold uppercase tracking-mr-label', tone === 'accent' ? 'text-mr-accent' : 'text-mr-tertiary');

export const PEField = ({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) => (
    <label className="mb-[14px] block">
        <div className="mb-1.5 text-mr-tiny font-mr-extrabold uppercase tracking-mr-label text-mr-accent">{label}</div>
        {children}
        {hint && <div className="mt-1 text-mr-tiny leading-normal text-mr-fg-subtle">{hint}</div>}
    </label>
);
