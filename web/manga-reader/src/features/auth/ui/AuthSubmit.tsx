import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export interface AuthSubmitProps {
    children: ReactNode;
    disabled?: boolean;
    loading?: boolean;
}

export const AuthSubmit = ({ children, disabled, loading }: AuthSubmitProps) => {
    const off = disabled || loading;

    return (
        <button
            type="submit"
            disabled={off}
            className={cn(
                'mt-2 w-full rounded-mr-xs border-0 px-4.5 py-3.5 text-[13px] font-mr-extrabold uppercase tracking-[0.12em] transition-colors duration-150',
                off ? 'cursor-not-allowed bg-mr-surface-elevated text-mr-fg-disabled' : 'cursor-pointer bg-mr-accent text-mr-on-accent hover:opacity-mr-hover',
            )}
        >
            {loading ? 'Carregando…' : children}
        </button>
    );
};

export default AuthSubmit;
