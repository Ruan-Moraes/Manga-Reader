import { FiSearch } from 'react-icons/fi';

type SearchInputTypes = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

const SearchInput = ({
    value,
    onChange,
    placeholder = 'Buscar...',
    disabled,
    className,
}: SearchInputTypes) => {
    return (
        <label className={`relative ${className ?? ''}`}>
            <FiSearch className="absolute -translate-y-1/2 left-3 top-1/2 text-tertiary" />
            <input
                type="text"
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full py-2 pl-10 pr-3 text-sm transition-shadow duration-300 border rounded-lg border-tertiary bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </label>
    );
};

export default SearchInput;
