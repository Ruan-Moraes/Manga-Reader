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
                <span className={error ? 'text-ui-tiny font-ui-extrabold uppercase tracking-[0.1em] text-ui-danger' : 'text-ui-tiny font-ui-extrabold uppercase tracking-[0.1em] text-ui-accent-fg'}>
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
                    ? 'w-full box-border rounded-ui-xs border border-ui-danger bg-ui-input px-3.5 py-3 text-[14px] tracking-mr text-ui-fg outline-none transition-colors duration-150 placeholder:text-ui-placeholder'
                    : 'w-full box-border rounded-ui-xs border border-ui-border bg-ui-input px-3.5 py-3 text-[14px] tracking-mr text-ui-fg outline-none transition-colors duration-150 placeholder:text-ui-placeholder focus:border-ui-accent-border'}
            />
            {(error?.trim() || hint) && (
                <div className={error?.trim() ? 'mt-1.5 text-ui-tiny tracking-mr text-ui-danger' : 'mt-1.5 text-ui-tiny tracking-mr text-ui-fg-subtle'}>
                    {error?.trim() || hint}
                </div>
            )}
        </label>
    );
};

export default AuthField;
