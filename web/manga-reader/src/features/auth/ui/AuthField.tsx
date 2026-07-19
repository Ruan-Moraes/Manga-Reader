import type { ChangeEvent, ReactNode } from 'react';

export interface AuthFieldProps {
    label: string;
    type?: 'text' | 'email' | 'password';
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    hint?: string;
    error?: string;
    autoComplete?: string;
    rightSlot?: ReactNode;
    id?: string;
    name?: string;
}

export const AuthField = ({ label, type = 'text', value, onChange, placeholder, hint, error, autoComplete, rightSlot, id, name }: AuthFieldProps) => {
    return (
        <label className="mb-3.5 block">
            <div className="mb-1.5 flex items-baseline justify-between">
                <span className={error ? 'text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-danger' : 'text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-accent-fg'}>
                    {label}
                </span>
                {rightSlot}
            </div>
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={error
                    ? 'w-full box-border rounded-mr-xs border border-mr-danger bg-mr-input px-3.5 py-3 text-[14px] tracking-mr text-mr-fg outline-none transition-colors duration-150 placeholder:text-mr-placeholder'
                    : 'w-full box-border rounded-mr-xs border border-mr-border bg-mr-input px-3.5 py-3 text-[14px] tracking-mr text-mr-fg outline-none transition-colors duration-150 placeholder:text-mr-placeholder focus:border-mr-accent-border'}
            />
            {(error?.trim() || hint) && (
                <div className={error?.trim() ? 'mt-1.5 text-mr-tiny tracking-mr text-mr-danger' : 'mt-1.5 text-mr-tiny tracking-mr text-mr-fg-subtle'}>
                    {error?.trim() || hint}
                </div>
            )}
        </label>
    );
};

export default AuthField;
