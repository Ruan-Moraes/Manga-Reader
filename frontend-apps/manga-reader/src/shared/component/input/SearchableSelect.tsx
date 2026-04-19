import ReactSelect, { type StylesConfig } from 'react-select';

export type SearchableSelectOption = {
    value: string;
    label: string;
};

type SearchableSelectProps = {
    label?: string;
    options: SearchableSelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    isLoading?: boolean;
    isClearable?: boolean;
    noOptionsMessage?: string;
    name?: string;
};

const selectStyles: StylesConfig<SearchableSelectOption> = {
    control: (provided, state) => ({
        ...provided,
        padding: '0.125rem 0.25rem',
        backgroundColor: '#161616',
        borderRadius: '0.125rem',
        border: state.isFocused
            ? '0.0625rem solid #ddda2a'
            : '0.0625rem solid #727273',
        boxShadow: 'none',
        cursor: 'text',
        transition: 'border-color 0.3s',
        minHeight: '2.375rem',
        '&:hover': {
            borderColor: '#ddda2a80',
        },
    }),
    placeholder: provided => ({
        ...provided,
        fontSize: '0.875rem',
        color: '#727273',
    }),
    valueContainer: provided => ({
        ...provided,
        padding: '0 0.25rem',
    }),
    input: provided => ({
        ...provided,
        margin: '0',
        padding: '0',
        color: '#FFFFFF',
        fontSize: '0.875rem',
    }),
    singleValue: provided => ({
        ...provided,
        color: '#FFFFFF',
        fontSize: '0.875rem',
    }),
    menu: provided => ({
        ...provided,
        borderRadius: '0.125rem',
        border: '0.0625rem solid #727273',
        backgroundColor: '#161616',
        zIndex: 50,
    }),
    menuList: provided => ({
        ...provided,
        padding: '0',
        maxHeight: '15rem',
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
            ? '#ddda2a40'
            : state.isFocused
              ? '#252526'
              : '#161616',
        color: state.isSelected ? '#FFFFFF' : '#FFFFFF',
        cursor: 'pointer',
        fontSize: '0.875rem',
        padding: '0.5rem 0.75rem',
        transition: 'background-color 0.15s',
        borderBottom: '0.0625rem solid #727273',
        ':last-child': {
            borderBottom: '0',
        },
        ':active': {
            backgroundColor: '#ddda2a40',
        },
    }),
    clearIndicator: provided => ({
        ...provided,
        padding: '0.125rem',
        cursor: 'pointer',
        color: '#727273',
        ':hover': {
            color: '#FFFFFF',
        },
    }),
    dropdownIndicator: provided => ({
        ...provided,
        padding: '0.125rem',
        color: '#727273',
        ':hover': {
            color: '#ddda2a',
        },
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    loadingIndicator: provided => ({
        ...provided,
        color: '#ddda2a',
    }),
    noOptionsMessage: provided => ({
        ...provided,
        color: '#727273',
        fontSize: '0.875rem',
    }),
};

const SearchableSelect = ({
    label,
    options,
    value,
    onChange,
    placeholder = 'Buscar...',
    disabled,
    error,
    isLoading,
    isClearable = true,
    noOptionsMessage = 'Nenhuma opção encontrada.',
    name,
}: SearchableSelectProps) => {
    const selectedOption = options.find(opt => opt.value === value) ?? null;

    const content = (
        <>
            <ReactSelect<SearchableSelectOption>
                options={options}
                value={selectedOption}
                onChange={option => onChange?.(option?.value ?? '')}
                placeholder={placeholder}
                isDisabled={disabled}
                isLoading={isLoading}
                isClearable={isClearable}
                isSearchable
                name={name}
                styles={selectStyles}
                noOptionsMessage={() => noOptionsMessage}
                loadingMessage={() => 'Carregando...'}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
        </>
    );

    if (!label) {
        return <div className="flex flex-col gap-1">{content}</div>;
    }

    return (
        <div>
            <label className="flex flex-col gap-1">
                <span className="text-xs font-bold">{label}</span>
                {content}
            </label>
        </div>
    );
};

export default SearchableSelect;
