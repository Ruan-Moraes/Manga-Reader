export type RadioOption = {
    value: string;
    label: string;
    description?: string;
};

type BaseRadioGroupTypes = {
    label?: string;
    options: RadioOption[];
    value: string;
    onChange: (value: string) => void;
    name: string;
    disabled?: boolean;
    className?: string;
    orientation?: 'vertical' | 'horizontal';
    error?: string;
};

const BaseRadioGroup = ({ label, options, value, onChange, name, disabled, className, orientation = 'horizontal', error }: BaseRadioGroupTypes) => {
    const containerClass = orientation === 'vertical' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2';

    return (
        <fieldset className={`flex flex-col gap-1.5 ${className ?? ''}`} disabled={disabled}>
            {label && <legend className="text-xs font-bold">{label}</legend>}
            <div role="radiogroup" className={containerClass}>
                {options.map(option => {
                    const isSelected = option.value === value;
                    const inputId = `${name}-${option.value}`;
                    const baseLabelClass =
                        orientation === 'vertical'
                            ? 'flex items-start gap-3 p-2.5 text-sm border rounded-xs transition-colors cursor-pointer select-none'
                            : 'relative flex items-center justify-center h-10 px-3 text-sm font-medium text-center transition-colors duration-300 border rounded-xs cursor-pointer';
                    const stateClass = isSelected
                        ? 'border-quaternary-default bg-quaternary-opacity-25'
                        : orientation === 'vertical'
                          ? 'border-tertiary hover:bg-tertiary/20'
                          : 'border-tertiary bg-secondary hover:bg-quaternary-opacity-25';
                    const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

                    if (orientation === 'horizontal') {
                        return (
                            <label key={option.value} htmlFor={inputId} className={`${baseLabelClass} ${stateClass} ${disabledClass}`}>
                                <input
                                    id={inputId}
                                    type="radio"
                                    value={option.value}
                                    name={name}
                                    checked={isSelected}
                                    onChange={() => onChange(option.value)}
                                    className="absolute inset-0 appearance-none cursor-pointer focus-visible:outline-2 focus-visible:outline-quaternary-default rounded-xs"
                                    disabled={disabled}
                                />
                                <span className="text-shadow-default">{option.label}</span>
                            </label>
                        );
                    }

                    return (
                        <label key={option.value} htmlFor={inputId} className={`${baseLabelClass} ${stateClass} ${disabledClass}`}>
                            <span className="relative flex items-center justify-center w-4 h-4 mt-0.5 shrink-0">
                                <input
                                    id={inputId}
                                    type="radio"
                                    name={name}
                                    value={option.value}
                                    checked={isSelected}
                                    disabled={disabled}
                                    onChange={() => onChange(option.value)}
                                    className="sr-only peer"
                                />
                                <span className="block w-4 h-4 transition-colors border rounded-full border-tertiary peer-checked:border-quaternary-default peer-focus-visible:ring-2 peer-focus-visible:ring-quaternary-default peer-focus-visible:ring-offset-1" />
                                <span
                                    className={`absolute w-2 h-2 transition-opacity rounded-full bg-quaternary-default ${
                                        isSelected ? 'opacity-100' : 'opacity-0'
                                    }`}
                                />
                            </span>
                            <span className="flex flex-col gap-0.5">
                                <span className="font-medium">{option.label}</span>
                                {option.description && <span className="text-xs text-tertiary">{option.description}</span>}
                            </span>
                        </label>
                    );
                })}
            </div>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </fieldset>
    );
};

export default BaseRadioGroup;
