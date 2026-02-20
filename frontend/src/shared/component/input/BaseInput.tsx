type BaseInputTypes = {
    label: string;
    placeholder: string;
    type: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
};

const BaseInput = ({
    label,
    placeholder,
    type,
    value,
    onChange,
    disabled,
}: BaseInputTypes) => {
    return (
        <div>
            <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{label}</span>
                <input
                    className="w-full p-2 transition-shadow duration-300 border-none rounded-xs outline-none appearance-none bg-tertiary placeholder-primary-default placeholder:text-sm shadow-default focus:shadow-inside hover:shadow-inside disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={placeholder}
                    type={type}
                    {...(value !== undefined && { value })}
                    {...(onChange && { onChange })}
                    disabled={disabled}
                />
            </label>
        </div>
    );
};

export default BaseInput;
