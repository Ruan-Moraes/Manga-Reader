import { useState } from 'react';
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
    const [focused, setFocused] = useState(false);
    const borderColor = error ? '#ff784f' : focused ? '#ddda2a' : '#2a2a2a';

    return (
        <label className="mb-3.5 block">
            <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em]" style={{ color: error ? '#ff784f' : '#ddda2a' }}>
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
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full rounded-mr-xs px-3.5 py-3 text-[14px] tracking-mr text-mr-fg outline-none transition-colors duration-150 placeholder:text-mr-tertiary"
                style={{
                    background: '#0f0f0f',
                    border: `1px solid ${borderColor}`,
                    boxSizing: 'border-box',
                }}
            />
            {(error?.trim() || hint) && (
                <div className="mt-1.5 text-mr-tiny tracking-mr" style={{ color: error?.trim() ? '#ff784f' : '#666' }}>
                    {error?.trim() || hint}
                </div>
            )}
        </label>
    );
};

export default AuthField;
