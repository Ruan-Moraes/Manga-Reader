type RadioOption = {
    value: string;
    label: string;
};

type BaseRadioGroupTypes = {
    label?: string;
    options: RadioOption[];
    value: string;
    onChange: (value: string) => void;
    name: string;
    disabled?: boolean;
    className?: string;
};

const BaseRadioGroup = ({
    label,
    options,
    value,
    onChange,
    name,
    disabled,
    className,
}: BaseRadioGroupTypes) => {
    return (
        <fieldset className={className} disabled={disabled}>
            {label && (
                <legend className="mb-1 text-xs font-bold">{label}</legend>
            )}
            <div className="flex flex-wrap gap-2">
                {options.map(option => {
                    const isSelected = option.value === value;

                    return (
                        <label
                            key={option.value}
                            className={`relative flex items-center justify-center h-10 text-sm text-center transition-colors duration-300 border rounded-xs cursor-pointer hover:bg-quaternary-opacity-25 ${
                                isSelected
                                    ? 'border-quaternary-default bg-quaternary-opacity-25'
                                    : 'border-tertiary bg-secondary'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <input
                                type="radio"
                                value={option.value}
                                name={name}
                                checked={isSelected}
                                onChange={() => onChange(option.value)}
                                className="absolute inset-0 appearance-none cursor-pointer"
                                disabled={disabled}
                            />
                            <span className="px-3 font-bold text-shadow-default">
                                {option.label}
                            </span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
};

export default BaseRadioGroup;
