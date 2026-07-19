import { cn } from '@shared/lib/cn';

/** Papéis canônicos exibidos em posts (porte de `.cs-role` do protótipo). */
export type Role = 'OP' | 'MOD' | 'AUTOR' | 'FIXADO';

const ROLE_STYLES: Record<Role, string> = {
    OP: 'bg-mr-gray-800 text-mr-fg-muted border-mr-gray-700',
    FIXADO: 'bg-mr-accent-25 text-mr-accent-fg border-mr-accent-50',
    AUTOR: 'bg-mr-accent-25 text-mr-accent-fg border-mr-accent-50',
    MOD: 'bg-mr-danger-15 text-mr-danger border-mr-danger-border',
};

export interface RoleChipProps {
    role: Role;
    label?: string;
    className?: string;
}

/** Chip de papel (OP / MOD / AUTOR / FIXADO) — idêntico em comentários, resenhas e fórum. */
export const RoleChip = ({ role, label, className }: RoleChipProps) => (
    <span
        className={cn(
            'inline-flex items-center gap-1 rounded-mr-full border px-[7px] py-px text-[10px] font-mr-extrabold uppercase tracking-mr-label',
            ROLE_STYLES[role],
            className,
        )}
    >
        {label ?? role}
    </span>
);

export default RoleChip;
