export type SelectOption = {
    value: string;
    label: string;
};

type BaseSelectTypes = {
    label?: string;
    options: SelectOption[];
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    disabled?: boolean;
    error?: string;
    name?: string;
    id?: string;
    className?: string;
};

const defaultSelectClass =
    'w-full p-2 transition-shadow duration-300 border-none rounded-xs outline-none appearance-none bg-tertiary text-sm shadow-default focus:shadow-inside hover:shadow-inside disabled:opacity-50 disabled:cursor-not-allowed';

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
    const selectClass = `${className ?? defaultSelectClass} ${error ? 'ring-1 ring-red-500' : ''}`;

    const selectElement = (
        <select
            className={selectClass}
            {...(value !== undefined && { value })}
            {...(onChange && { onChange })}
            disabled={disabled}
            name={name}
            id={id}
        >
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );

    if (!label) {
        return (
            <div>
                {selectElement}
                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        );
    }

    return (
        <div>
            <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{label}</span>
                {selectElement}
                {error && <span className="text-xs text-red-500">{error}</span>}
            </label>
        </div>
    );
};

export default BaseSelect;
