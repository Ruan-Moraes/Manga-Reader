import { type ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

/**
 * Estilos do modal de edição de perfil, em classes Tailwind (tokens `ui-*` de
 * `styles/index.css`). Migrado de `style` inline para Tailwind conforme a regra de
 * styling do CLAUDE.md — inline fica reservado a valores dinâmicos de runtime.
 */

// Input padrão (altura fixa).
export const peInput =
    'box-border h-10 w-full rounded-ui-xs border border-ui-gray-700 bg-ui-secondary px-3 font-ui-sans text-[13px] tracking-mr text-ui-fg outline-none';

// Input "nu" para uso dentro de um grupo com prefixo (sem borda/fundo próprios).
export const peInputBare = 'h-full w-full border-0 bg-transparent px-3 font-ui-sans text-[13px] tracking-mr text-ui-fg outline-none';

export const peIntro = 'mb-[18px] text-ui-small leading-relaxed text-ui-gray-200';

export const peSmallBtn = (kind: 'ghost' | 'danger') =>
    cn(
        'cursor-pointer rounded-ui-xs border bg-transparent px-2.5 py-1.5 text-ui-tiny font-ui-bold tracking-mr',
        kind === 'danger' ? 'border-ui-danger text-ui-danger' : 'border-ui-tertiary text-ui-fg',
    );

export const peEyebrow = (tone: 'accent' | 'muted' = 'accent') =>
    cn('mb-2 text-ui-tiny font-ui-extrabold uppercase tracking-ui-label', tone === 'accent' ? 'text-ui-accent-fg' : 'text-ui-tertiary');

export const PEField = ({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) => (
    <label className="mb-[14px] block">
        <div className="mb-1.5 text-ui-tiny font-ui-extrabold uppercase tracking-ui-label text-ui-accent-fg">{label}</div>
        {children}
        {hint && <div className="mt-1 text-ui-tiny leading-normal text-ui-fg-subtle">{hint}</div>}
    </label>
);
