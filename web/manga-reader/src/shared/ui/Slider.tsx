import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from '@shared/lib/cn';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    /** Sufixo exibido no chip de valor, ex.: 'px'. */
    unit?: string;
    /** Esconde o chip de valor monospace à direita. */
    hideValue?: boolean;
}

export const Slider = ({ value, onChange, min = 0, max = 100, step = 1, label, unit, hideValue, disabled, id, className, ...rest }: SliderProps) => {
    const autoId = useId();
    const fieldId = id ?? autoId;

    const range = max - min || 1;
    const pct = Math.min(100, Math.max(0, ((value - min) / range) * 100));

    return (
        <div className={cn('flex w-full items-center gap-3', disabled && 'opacity-mr-disabled', className)}>
            {label && (
                <label htmlFor={fieldId} className="text-mr-small font-mr-bold text-mr-fg">
                    {label}
                </label>
            )}

            <div className="relative flex h-4 flex-1 items-center">
                <span className="absolute inset-x-0 h-1 rounded-mr-full bg-mr-gray-700" aria-hidden="true" />
                <span className="absolute left-0 h-1 rounded-mr-full bg-mr-accent" style={{ width: `${pct}%` }} aria-hidden="true" />
                <span
                    className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-mr-full border-2 border-mr-primary bg-mr-accent shadow-[0_0_0_1px_var(--mr-accent)] transition-all duration-mr-default"
                    style={{ left: `${pct}%` }}
                    aria-hidden="true"
                />
                <input
                    id={fieldId}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    disabled={disabled}
                    onChange={e => onChange(Number(e.target.value))}
                    className="mr-focus-ring absolute inset-0 m-0 h-4 w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed"
                    aria-label={label}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={value}
                    {...rest}
                />
            </div>

            {!hideValue && (
                <span className="inline-flex min-w-[3.25rem] shrink-0 justify-center rounded-mr-xs border border-mr-gray-700 bg-mr-gray-800 px-2 py-0.5 font-mr-mono text-mr-tiny tabular-nums text-mr-accent">
                    {value}
                    {unit ? ` ${unit}` : ''}
                </span>
            )}
        </div>
    );
};

export default Slider;
