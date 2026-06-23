import type { ReactNode } from 'react';

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
            className="mt-2 w-full rounded-mr-xs px-4.5 py-3.5 text-[13px] font-mr-extrabold uppercase tracking-[0.12em] transition-colors duration-150"
            style={{
                background: off ? '#2a2a2a' : '#ddda2a',
                color: off ? '#666' : '#161616',
                cursor: off ? 'not-allowed' : 'pointer',
                border: 'none',
            }}
        >
            {loading ? 'Carregando…' : children}
        </button>
    );
};

export default AuthSubmit;
