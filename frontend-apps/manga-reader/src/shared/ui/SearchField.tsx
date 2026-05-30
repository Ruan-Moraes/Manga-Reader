import type { InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';

import { IconButton } from './IconButton';

import { Kbd } from './Kbd';
import { cn } from '@/lib/cn';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value' | 'size'> {
    value: string;
    onChange: (value: string) => void;
    shortcut?: string;
    hideClear?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<NonNullable<SearchFieldProps['size']>, string> = {
    sm: 'h-9',
    md: 'h-11',
    lg: 'h-14',
};

export const SearchField = ({ value, onChange, shortcut, hideClear, size = 'md', placeholder, className, disabled, ...rest }: SearchFieldProps) => (
    <div
        className={cn(
            'flex items-center gap-2 rounded-mr-xs border border-mr-tertiary bg-mr-primary px-3 transition-colors duration-mr-default',
            'has-[:hover:not(:disabled)]:border-mr-accent-50 has-[:focus]:border-mr-accent w-full',
            sizeMap[size],
            disabled && 'opacity-mr-disabled',
            className,
        )}
    >
        <Search className="size-4 shrink-0 text-mr-tertiary" aria-hidden="true" />
        <input
            type="search"
            value={value}
            disabled={disabled}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder ?? 'Buscar...'}
            className="size-full min-w-0 flex-1 bg-transparent text-mr-body text-mr-fg outline-none placeholder:text-mr-tertiary w-full"
            {...rest}
        />
        {value && !hideClear && <IconButton icon={X} size="sm" variant="ghost" aria-label="Limpar busca" onClick={() => onChange('')} />}
        {shortcut && !value && <Kbd size="sm">{shortcut}</Kbd>}
    </div>
);

export default SearchField;
