import { useId } from 'react';

export interface RadioOption {
    value: string;
    label: string;
    hint?: string;
    disabled?: boolean;
}

export interface RadioGroupProps {
    name: string;
    value?: string;
    onChange?: (value: string) => void;
    options: RadioOption[];
    layout?: 'vertical' | 'horizontal';
    legend?: string;
}

export const RadioGroup = ({ name, value, onChange, options, layout = 'vertical', legend }: RadioGroupProps) => {
    const baseId = useId();

    return (
        <fieldset className={`border-none p-0 m-0 ${layout === 'vertical' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-4'}`}>
            {legend && <legend className="mr-label mb-2">{legend}</legend>}
            {options.map(o => {
                const id = `${baseId}-${o.value}`;
                return (
                    <label
                        key={o.value}
                        htmlFor={id}
                        className={`flex cursor-pointer items-start gap-2 text-mr-body ${o.disabled ? 'cursor-not-allowed opacity-mr-disabled' : ''}`}
                    >
                        <input
                            id={id}
                            type="radio"
                            name={name}
                            value={o.value}
                            checked={value === o.value}
                            disabled={o.disabled}
                            onChange={() => onChange?.(o.value)}
                            className="mt-0.5 size-4 shrink-0 cursor-pointer"
                            style={{ accentColor: 'var(--mr-accent)' }}
                        />
                        <span className="flex flex-col">
                            <span className="text-mr-fg">{o.label}</span>
                            {o.hint && <span className="text-mr-tiny text-mr-fg-subtle">{o.hint}</span>}
                        </span>
                    </label>
                );
            })}
        </fieldset>
    );
};

export default RadioGroup;
