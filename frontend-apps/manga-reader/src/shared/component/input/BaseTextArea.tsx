type BaseTextAreaVariant = 'default' | 'outlined';

type BaseTextAreaTypes = {
    label: string;
    placeholder: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    disabled?: boolean;
    error?: string;
    name?: string;
    rows?: number;
    variant?: BaseTextAreaVariant;
};

const VARIANT_CLASSES: Record<BaseTextAreaVariant, string> = {
    default:
        'w-full p-2 transition-shadow duration-300 border-none rounded-xs outline-none appearance-none bg-tertiary placeholder-primary-default placeholder:text-sm shadow-default focus:shadow-inside hover:shadow-inside',
    outlined:
        'w-full px-3 py-2 text-sm border rounded-xs outline-none bg-primary-default border-tertiary placeholder:text-tertiary transition-colors duration-300 focus:border-quaternary-default hover:border-quaternary-opacity-50',
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
    variant = 'default',
}: BaseTextAreaTypes) => {
    const textareaClass = `${VARIANT_CLASSES[variant]} resize-y disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'ring-1 ring-red-500' : ''}`;

    return (
        <div>
            <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{label}</span>
                <textarea
                    className={textareaClass}
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
