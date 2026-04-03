type BaseTextAreaTypes = {
    label: string;
    placeholder: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    disabled?: boolean;
    error?: string;
    name?: string;
    rows?: number;
};

const BaseTextArea = ({
    label,
    placeholder,
    value,
    onChange,
    disabled,
    error,
    name,
    rows = 4,
}: BaseTextAreaTypes) => {
    return (
        <div>
            <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{label}</span>
                <textarea
                    className={`w-full p-2 transition-shadow duration-300 border-none rounded-xs outline-none appearance-none bg-tertiary placeholder-primary-default placeholder:text-sm shadow-default focus:shadow-inside hover:shadow-inside disabled:opacity-50 disabled:cursor-not-allowed resize-y ${error ? 'ring-1 ring-red-500' : ''}`}
                    placeholder={placeholder}
                    rows={rows}
                    {...(value !== undefined && { value })}
                    {...(onChange && { onChange })}
                    disabled={disabled}
                    name={name}
                />
                {error && <span className="text-xs text-red-500">{error}</span>}
            </label>
        </div>
    );
};

export default BaseTextArea;
