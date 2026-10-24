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
                'mt-2 w-full rounded-ui-xs border-0 px-4.5 py-3.5 text-[13px] font-ui-extrabold uppercase tracking-[0.12em] transition-colors duration-150',
                off ? 'cursor-not-allowed bg-ui-surface-elevated text-ui-fg-disabled' : 'cursor-pointer bg-ui-accent text-ui-on-accent hover:opacity-ui-hover',
            )}
        >
            {loading ? 'Carregando…' : children}
        </button>
    );
};

export default AuthSubmit;
