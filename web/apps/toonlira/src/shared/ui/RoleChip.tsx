import { cn } from '@shared/lib/cn';

/** Papéis canônicos exibidos em posts (porte de `.cs-role` do protótipo). */
export type Role = 'OP' | 'MOD' | 'AUTOR' | 'FIXADO';

const ROLE_STYLES: Record<Role, string> = {
    OP: 'bg-ui-gray-800 text-ui-fg-muted border-ui-gray-700',
    FIXADO: 'bg-ui-accent-25 text-ui-accent-fg border-ui-accent-50',
    AUTOR: 'bg-ui-accent-25 text-ui-accent-fg border-ui-accent-50',
    MOD: 'bg-ui-danger-15 text-ui-danger border-ui-danger-border',
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
            'inline-flex items-center gap-1 rounded-ui-full border px-[7px] py-px text-[10px] font-ui-extrabold uppercase tracking-ui-label',
            ROLE_STYLES[role],
            className,
        )}
    >
        {label ?? role}
    </span>
);

export default RoleChip;
