import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

import { Kbd } from './Kbd';
import { cn } from '@shared/lib/cn';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value' | 'size'> {
    value: string;
    onChange: (value: string) => void;
    shortcut?: string;
    hideClear?: boolean;
    clearAriaLabel?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<NonNullable<SearchFieldProps['size']>, string> = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-12',
};

const clearSizeMap: Record<NonNullable<SearchFieldProps['size']>, string> = {
    sm: 'size-5',
    md: 'size-6',
    lg: 'size-7',
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
    { value, onChange, shortcut, hideClear, clearAriaLabel, size = 'md', placeholder, className, disabled, ...rest },
    ref,
) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-mr-xs border border-mr-tertiary bg-mr-primary px-3 transition-colors duration-mr-default',
                'has-[:hover:not(:disabled)]:border-mr-accent-50 has-[:focus]:border-mr-accent w-full',
                sizeMap[size],
                disabled && 'opacity-mr-disabled',
                className,
            )}
        >
            <Search className="size-5 shrink-0 text-mr-tertiary" aria-hidden="true" />
            <input
                ref={ref}
                type="search"
                value={value}
                disabled={disabled}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder ?? 'Buscar...'}
                className={cn(
                    'size-full min-w-0 flex-1 bg-transparent text-mr-body text-mr-fg outline-none placeholder:text-mr-tertiary w-full',
                    '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden',
                )}
                {...rest}
            />
            {value && !hideClear && (
                <button
                    type="button"
                    aria-label={clearAriaLabel ?? 'Limpar busca'}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => onChange('')}
                    className={cn(
                        'inline-flex shrink-0 items-center justify-center rounded-mr-full text-mr-tertiary cursor-pointer',
                        'transition-colors duration-mr-default hover:bg-mr-accent-25 hover:text-mr-fg active:bg-mr-accent-50',
                        'mr-focus-ring',
                        clearSizeMap[size],
                    )}
                >
                    <X className="size-3.5" aria-hidden="true" />
                </button>
            )}
            {shortcut && !value && <Kbd size="sm">{shortcut}</Kbd>}
        </div>
    );
});

export default SearchField;
