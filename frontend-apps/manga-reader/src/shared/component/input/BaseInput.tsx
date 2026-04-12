type BaseInputVariant = 'default' | 'outlined';

type BaseInputTypes = {
    label: string;
    placeholder: string;
    type: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    error?: string;
    name?: string;
    variant?: BaseInputVariant;
    autoFocus?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    maxLength?: number;
};

const VARIANT_CLASSES: Record<BaseInputVariant, string> = {
    default:
        'w-full p-2 transition-shadow duration-300 border-none rounded-xs outline-none appearance-none bg-tertiary placeholder-primary-default placeholder:text-sm shadow-default focus:shadow-inside hover:shadow-inside',
    outlined:
        'w-full px-3 py-2 text-sm border rounded-xs outline-none bg-primary-default border-tertiary placeholder:text-tertiary transition-colors duration-300 focus:border-quaternary-default hover:border-quaternary-opacity-50',
};

const BaseInput = ({
    label,
    placeholder,
    type,
    value,
    onChange,
    disabled,
    error,
    name,
    variant = 'default',
    autoFocus,
    min,
    max,
    step,
    maxLength,
}: BaseInputTypes) => {
    const inputClass = `${VARIANT_CLASSES[variant]} disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'ring-1 ring-red-500' : ''}`;

    return (
        <div>
            <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{label}</span>
                <input
                    className={inputClass}
                    placeholder={placeholder}
                    type={type}
                    {...(value !== undefined && { value })}
                    {...(onChange && { onChange })}
                    disabled={disabled}
                    name={name}
                    autoFocus={autoFocus}
                    {...(min !== undefined && { min })}
                    {...(max !== undefined && { max })}
                    {...(step !== undefined && { step })}
                    {...(maxLength !== undefined && { maxLength })}
                />
                {error && <span className="text-xs text-red-500">{error}</span>}
            </label>
        </div>
    );
};

export default BaseInput;
