import type { ChangeEvent, SelectHTMLAttributes } from 'react';
import { forwardRef, useMemo, useRef, useState, useImperativeHandle } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import * as RD from '@radix-ui/react-dropdown-menu';

import { cn } from '@shared/lib/cn';
import { useFloatingPortalContainer } from './FloatingPortalContext';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectBaseProps {
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    hint?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
    'aria-label'?: string;
}

export interface SingleSelectProps extends SelectBaseProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, keyof SelectBaseProps | 'value' | 'onChange' | 'multiple'> {
    multiple?: false;
    value?: string;
    onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}

export interface MultiSelectProps extends SelectBaseProps {
    multiple: true;
    value: string[];
    onChange: (value: string[]) => void;
    /** Exibe um campo de busca no topo do menu para filtrar as opções. Padrão: true. */
    searchable?: boolean;
    searchPlaceholder?: string;
    noOptionsMessage?: string;
}

export type SelectProps = SingleSelectProps | MultiSelectProps;

const MENU_CONTENT_CLASS =
    'z-ui-dropdown flex max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] flex-col gap-y-0.5 overflow-y-auto scroll-py-1 rounded-ui-md bg-ui-surface-elevated p-1.5 shadow-ui-elevated animate-ui-fade-in';

const OPTION_CLASS =
    'flex h-10 cursor-pointer items-center gap-2 rounded-ui-sm border-0 px-3 text-ui-body outline-none ring-0 transition-[background-color,color] duration-ui-fast focus-visible:!outline-none focus-visible:!outline-offset-0 focus-visible:!ring-0 data-[highlighted]:border-0 data-[highlighted]:ring-0';

const SELECTED_OPTION_CLASS = 'bg-ui-accent-10 text-ui-accent-fg font-ui-bold';

const toSelectValue = (value: string | number | readonly string[] | undefined) => (typeof value === 'string' || typeof value === 'number' ? String(value) : '');

const SingleSelect = forwardRef<HTMLSelectElement, SingleSelectProps>(function SingleSelect(
    { options, placeholder, error, hint, disabled, className, id, value, defaultValue, onChange, 'aria-label': ariaLabel, ...rest },
    ref,
) {
    const describedBy = hint || error ? `${id ?? 'select'}-hint` : undefined;
    const internalRef = useRef<HTMLSelectElement>(null);
    const [uncontrolledValue, setUncontrolledValue] = useState(() => toSelectValue(defaultValue));
    // Dentro de um Modal (<dialog> na top layer), o menu precisa portalar para o próprio dialog.
    const portalContainer = useFloatingPortalContainer();

    useImperativeHandle(ref, () => internalRef.current!);

    const selectedValue = value ?? uncontrolledValue;
    const selectedOption = useMemo(() => options.find(o => String(o.value) === selectedValue), [options, selectedValue]);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    const handleSelect = (val: string) => {
        if (value === undefined) setUncontrolledValue(val);

        if (internalRef.current) {
            // Mudança programática do valor para garantir que o evento de mudança seja disparado
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;

            nativeInputValueSetter?.call(internalRef.current, val);

            // Dispara o evento nativo de change no <select> escondido, que já está
            // ligado a `onChange` (inclusive react-hook-form) — sem cast sintético.
            const event = new Event('change', { bubbles: true });

            internalRef.current.dispatchEvent(event);
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <RD.Root modal={false}>
                <RD.Trigger asChild>
                    <button
                        type="button"
                        role="combobox"
                        id={id}
                        disabled={disabled}
                        className={cn(
                            'group relative flex h-11 w-full items-center rounded-ui-sm border bg-ui-primary px-3 pr-9 text-left text-ui-body text-ui-fg transition-[border-color,box-shadow] duration-ui-fast outline-none',
                            'hover:not(:disabled):border-ui-gray-500 focus-visible:border-ui-accent-border focus-visible:ring-2 focus-visible:ring-ui-accent-25',
                            'data-[state=open]:border-ui-accent-border data-[state=open]:ring-2 data-[state=open]:ring-ui-accent-25',
                            error ? 'border-ui-danger' : 'border-ui-border',
                            disabled && 'cursor-not-allowed bg-ui-surface-muted border-ui-border-subtle text-ui-fg-disabled opacity-100',
                            className,
                        )}
                        aria-invalid={!!error || undefined}
                        aria-describedby={describedBy}
                        aria-label={ariaLabel ?? (typeof displayLabel === 'string' && displayLabel ? displayLabel : undefined)}
                    >
                        <span className={cn('block truncate', disabled ? 'text-ui-fg-disabled' : selectedOption ? 'font-ui-semibold text-ui-fg' : 'text-ui-fg-muted')}>{displayLabel}</span>
                        <ChevronDown className={cn('pointer-events-none absolute right-3 size-4 text-ui-tertiary transition-transform duration-ui-default group-data-[state=open]:rotate-180 group-data-[state=open]:text-ui-accent-fg', disabled && 'text-ui-fg-disabled')} />
                    </button>
                </RD.Trigger>

                <RD.Portal container={portalContainer ?? undefined}>
                    <RD.Content
                        align="start"
                        sideOffset={4}
                        className={MENU_CONTENT_CLASS}
                    >
                        {options.map(o => (
                            <RD.Item
                                key={o.value}
                                disabled={o.disabled}
                                onSelect={() => handleSelect(o.value)}
                                className={cn(
                                    OPTION_CLASS,
                                    'data-[highlighted]:bg-ui-accent-25 data-[highlighted]:text-ui-fg',
                                    String(o.value) === selectedValue ? SELECTED_OPTION_CLASS : 'text-ui-fg',
                                    o.disabled && 'opacity-ui-disabled cursor-not-allowed',
                                )}
                            >
                                <span className="flex-1 truncate">{o.label}</span>
                                {String(o.value) === selectedValue && <Check className="size-4 shrink-0 text-ui-accent-fg" />}
                            </RD.Item>
                        ))}
                    </RD.Content>
                </RD.Portal>
            </RD.Root>

            <select ref={internalRef} value={selectedValue} onChange={onChange} disabled={disabled} className="sr-only" tabIndex={-1} aria-hidden="true" {...rest}>
                {placeholder && (
                    <option value="" disabled hidden>
                        {placeholder}
                    </option>
                )}
                {options.map(o => (
                    <option key={o.value} value={o.value} disabled={o.disabled}>
                        {o.label}
                    </option>
                ))}
            </select>

            {(error ?? hint) && (
                <p id={describedBy} className={cn('text-ui-tiny', error ? 'text-ui-danger' : 'text-ui-fg-subtle')}>
                    {error ?? hint}
                </p>
            )}
        </div>
    );
});

function MultiSelect({
    options,
    placeholder,
    error,
    hint,
    disabled,
    className,
    id,
    value,
    onChange,
    searchable = true,
    searchPlaceholder,
    noOptionsMessage,
    'aria-label': ariaLabel,
}: MultiSelectProps) {
    const describedBy = hint || error ? `${id ?? 'select'}-hint` : undefined;
    const portalContainer = useFloatingPortalContainer();
    const [query, setQuery] = useState('');

    const selectedOptions = useMemo(() => options.filter(o => value.includes(o.value)), [options, value]);

    const filteredOptions = useMemo(() => {
        if (!query.trim()) return options;

        const normalized = query.trim().toLowerCase();

        return options.filter(o => o.label.toLowerCase().includes(normalized));
    }, [options, query]);

    const toggleValue = (val: string) => {
        if (value.includes(val)) {
            onChange(value.filter(v => v !== val));
        } else {
            onChange([...value, val]);
        }
    };

    const removeValue = (val: string) => {
        onChange(value.filter(v => v !== val));
    };

    return (
        <div className="flex flex-col gap-1">
            <RD.Root modal={false} onOpenChange={open => !open && setQuery('')}>
                <RD.Trigger asChild>
                    <div
                        role="combobox"
                        aria-invalid={!!error || undefined}
                        aria-describedby={describedBy}
                        aria-label={ariaLabel}
                        aria-disabled={disabled || undefined}
                        id={id}
                        tabIndex={disabled ? -1 : 0}
                        className={cn(
                            'group relative flex min-h-11 w-full flex-wrap items-center gap-1 rounded-ui-sm border bg-ui-primary px-3 py-1.5 pr-9 text-left text-ui-body text-ui-fg transition-[border-color,box-shadow] duration-ui-fast outline-none',
                            'hover:not(:disabled):border-ui-gray-500 focus-visible:border-ui-accent-border focus-visible:ring-2 focus-visible:ring-ui-accent-25',
                            'data-[state=open]:border-ui-accent-border data-[state=open]:ring-2 data-[state=open]:ring-ui-accent-25',
                            error ? 'border-ui-danger' : 'border-ui-border',
                            disabled && 'pointer-events-none cursor-not-allowed bg-ui-surface-muted border-ui-border-subtle text-ui-fg-disabled opacity-100',
                            className,
                        )}
                    >
                        {selectedOptions.length === 0 ? (
                            <span className="block truncate text-ui-fg-muted">{placeholder}</span>
                        ) : (
                            selectedOptions.map(o => (
                                <span
                                    key={o.value}
                                    className="inline-flex items-center gap-1 rounded-ui-sm border border-ui-accent-25 bg-ui-accent-10 px-2 py-0.5 text-ui-tiny text-ui-fg"
                                >
                                    <span className="truncate">{o.label}</span>
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onPointerDownCapture={e => e.stopPropagation()}
                                        onClick={e => {
                                            e.stopPropagation();
                                            removeValue(o.value);
                                        }}
                                        className="text-ui-fg-subtle hover:text-ui-danger"
                                        aria-label={o.label}
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            ))
                        )}
                        <ChevronDown className="pointer-events-none absolute right-3 size-4 text-ui-tertiary transition-transform duration-ui-default group-data-[state=open]:rotate-180 group-data-[state=open]:text-ui-accent-fg" />
                    </div>
                </RD.Trigger>

                <RD.Portal container={portalContainer ?? undefined}>
                    <RD.Content
                        align="start"
                        sideOffset={4}
                        onCloseAutoFocus={e => e.preventDefault()}
                        className={MENU_CONTENT_CLASS}
                    >
                        {searchable && (
                            <input
                                type="text"
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.stopPropagation()}
                                placeholder={searchPlaceholder}
                                className="mb-1 h-9 shrink-0 rounded-ui-sm bg-ui-primary px-2 text-ui-body text-ui-fg outline-none transition-[background-color,box-shadow] duration-ui-fast placeholder:text-ui-tertiary focus-visible:bg-ui-surface-muted focus-visible:ring-2 focus-visible:ring-ui-accent-25"
                            />
                        )}

                        {filteredOptions.length === 0 && (
                            <p className="px-3 py-2 text-ui-tiny text-ui-fg-subtle">{noOptionsMessage}</p>
                        )}

                        {filteredOptions.map(o => {
                            const checked = value.includes(o.value);

                            return (
                                <RD.CheckboxItem
                                    key={o.value}
                                    disabled={o.disabled}
                                    checked={checked}
                                    onSelect={e => e.preventDefault()}
                                    onCheckedChange={() => toggleValue(o.value)}
                                    className={cn(
                                        OPTION_CLASS,
                                        'data-[highlighted]:bg-ui-accent-25 data-[highlighted]:text-ui-fg',
                                        checked ? SELECTED_OPTION_CLASS : 'text-ui-fg',
                                        o.disabled && 'opacity-ui-disabled cursor-not-allowed',
                                    )}
                                >
                                    <span className="flex-1 truncate">{o.label}</span>
                                    {checked && <Check className="size-4 shrink-0" />}
                                </RD.CheckboxItem>
                            );
                        })}
                    </RD.Content>
                </RD.Portal>
            </RD.Root>

            {(error ?? hint) && (
                <p id={describedBy} className={cn('text-ui-tiny', error ? 'text-ui-danger' : 'text-ui-fg-subtle')}>
                    {error ?? hint}
                </p>
            )}
        </div>
    );
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
    if (props.multiple) {
        return <MultiSelect {...props} />;
    }

    return <SingleSelect {...props} ref={ref} />;
});

export default Select;
