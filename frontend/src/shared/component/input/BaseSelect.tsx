import { useCallback, useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

export type SelectOption = {
    value: string;
    label: string;
};

type BaseSelectTypes = {
    label?: string;
    options: SelectOption[];
    value?: string;
    onChange?: (e: { target: { value: string } }) => void;
    disabled?: boolean;
    error?: string;
    name?: string;
    id?: string;
    className?: string;
};

const BaseSelect = ({
    label,
    options,
    value,
    onChange,
    disabled,
    error,
    name,
    id,
    className,
}: BaseSelectTypes) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption?.label ?? options[0]?.label ?? '';

    const handleSelect = useCallback(
        (optionValue: string) => {
            if (disabled) return;

            onChange?.({ target: { value: optionValue } });

            setIsOpen(false);
        },
        [disabled, onChange],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (disabled) return;

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();

                setIsOpen(prev => !prev);
            }

            if (e.key === 'Escape') {
                setIsOpen(false);
            }

            if (e.key === 'ArrowDown' && isOpen) {
                e.preventDefault();

                const currentIndex = options.findIndex(
                    opt => opt.value === value,
                );

                const nextIndex =
                    currentIndex < options.length - 1 ? currentIndex + 1 : 0;

                handleSelect(options[nextIndex].value);
            }

            if (e.key === 'ArrowUp' && isOpen) {
                e.preventDefault();

                const currentIndex = options.findIndex(
                    opt => opt.value === value,
                );

                const prevIndex =
                    currentIndex > 0 ? currentIndex - 1 : options.length - 1;

                handleSelect(options[prevIndex].value);
            }
        },
        [disabled, isOpen, options, value, handleSelect],
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const triggerClass = className
        ? `${className} ${error ? 'ring-1 ring-red-500' : ''}`
        : `w-full p-2 text-sm transition-shadow duration-300 border-none rounded-xs outline-none bg-tertiary shadow-default focus:shadow-inside hover:shadow-inside disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'ring-1 ring-red-500' : ''}`;

    const selectContent = (
        <div ref={containerRef} className="relative" id={id}>
            <input type="hidden" name={name} value={value ?? ''} />

            <button
                type="button"
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                disabled={disabled}
                className={`${triggerClass} flex items-center justify-between gap-2 cursor-pointer text-left`}
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                onKeyDown={handleKeyDown}
            >
                <span className="truncate">{displayLabel}</span>
                <FiChevronDown
                    className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    size={14}
                />
            </button>

            {isOpen && (
                <ul
                    role="listbox"
                    className="absolute z-50 w-full mt-1 overflow-y-auto border rounded-xs border-tertiary bg-secondary max-h-60"
                >
                    {options.map(option => {
                        const isSelected = option.value === value;

                        return (
                            <li
                                key={option.value}
                                role="option"
                                aria-selected={isSelected}
                                className={`px-3 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                                    isSelected
                                        ? 'bg-quaternary-opacity-25 font-semibold'
                                        : 'hover:bg-tertiary'
                                }`}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );

    if (!label) {
        return (
            <div>
                {selectContent}
                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        );
    }

    return (
        <div>
            <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{label}</span>
                {selectContent}
                {error && <span className="text-xs text-red-500">{error}</span>}
            </label>
        </div>
    );
};

export default BaseSelect;
