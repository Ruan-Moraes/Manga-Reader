import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

/** Subtítulo de painel (18/800) + grupo de fields. */
export const SettingSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="mb-8">
        <h3 className="mb-1 text-[18px] font-mr-extrabold text-mr-fg">{title}</h3>
        <div className="flex flex-col">{children}</div>
    </section>
);

interface SettingRowProps {
    label: string;
    desc?: string;
    /** Controle ocupa a largura abaixo do label (SegmentedControl, Slider, RadioGroup, Checkbox group). */
    block?: boolean;
    children: ReactNode;
}

/**
 * Field: label (14/700 branco) + desc opcional (12px) à esquerda e controle à direita; separador
 * inferior 1px. Em `block`, o controle vai abaixo do label, ocupando a largura.
 */
export const SettingRow = ({ label, desc, block, children }: SettingRowProps) => (
    <div className={cn('border-b border-mr-separator py-[18px]', block ? 'flex flex-col gap-3' : 'flex items-start justify-between gap-4')}>
        <div className={cn('min-w-0', !block && 'flex-1')}>
            <p className="text-mr-body font-mr-bold text-mr-fg">{label}</p>
            {desc && <p className="mt-0.5 max-w-[44ch] text-mr-small text-mr-fg-subtle">{desc}</p>}
        </div>
        <div className={cn(block ? 'w-full' : 'shrink-0')}>{children}</div>
    </div>
);
