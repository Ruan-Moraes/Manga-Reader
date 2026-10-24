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
                'flex items-center gap-2 rounded-ui-xs border border-ui-tertiary bg-ui-primary px-3 transition-colors duration-ui-default',
                'has-[:hover:not(:disabled)]:border-ui-accent-50 has-[:focus]:border-ui-accent-border w-full',
                sizeMap[size],
                disabled && 'opacity-ui-disabled',
                className,
            )}
        >
            <Search className="size-5 shrink-0 text-ui-tertiary" aria-hidden="true" />
            <input
                ref={ref}
                type="search"
                value={value}
                disabled={disabled}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder ?? 'Buscar...'}
                className={cn(
                    'size-full min-w-0 flex-1 bg-transparent text-ui-body text-ui-fg outline-none placeholder:text-ui-tertiary w-full',
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
                        'inline-flex shrink-0 items-center justify-center rounded-ui-full text-ui-tertiary cursor-pointer',
                        'transition-colors duration-ui-default hover:bg-ui-accent-25 hover:text-ui-fg active:bg-ui-accent-50',
                        'ui-focus-ring',
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
