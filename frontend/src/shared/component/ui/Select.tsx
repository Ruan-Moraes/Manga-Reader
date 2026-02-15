import ReactSelect, {
    Props as ReactSelectProps,
    StylesConfig,
} from 'react-select';

import { SelectVariant } from '@shared/type/select-variant.types';

export type SelectOption = {
    value: string | number;
    label: string;
    isDisabled?: boolean;
};

interface SelectProps extends Omit<ReactSelectProps<SelectOption>, 'styles'> {
    variant?: SelectVariant;
    customStyles?: StylesConfig<SelectOption>;
    menuPlacement?: 'auto' | 'bottom' | 'top';
}

const getVariantStyles = (
    variant: SelectVariant,
): StylesConfig<SelectOption> => {
    const baseStyles: StylesConfig<SelectOption> = {
        control: (provided, state) => ({
            ...provided,
            padding: '0.5rem',
            backgroundColor: '#252526',
            borderRadius: '0.125rem',
            border: state.isFocused
                ? '0.0625rem solid #ddda2a'
                : '0.0625rem solid #727273',
            boxShadow: state.isFocused ? '0 0 0 0' : '0 0 0 0',
            cursor: 'text',
            transition: 'border 0.3s',
            '&:hover': {
                border: state.isFocused ? 0 : 0,
            },
        }),
        placeholder: provided => ({
            ...provided,
            fontSize: '0.875rem',
            lineHeight: '1rem',
            color: '#FFFFFF',
        }),
        valueContainer: provided => ({
            ...provided,
            padding: '0',
        }),
        input: provided => ({
            ...provided,
            margin: '0 0 0 0.25rem',
            padding: '0',
            color: '#FFFFFF',
        }),
        singleValue: provided => ({
            ...provided,
            color: '#FFFFFF',
        }),
        multiValue: provided => ({
            ...provided,
            margin: '0.125rem',
            padding: '0.25rem',
            borderRadius: '0.125rem',
            backgroundColor: '#161616',
            transition: 'background-color 0.3s',
            ':hover': {
                backgroundColor: '#161616bf',
            },
        }),
        multiValueLabel: provided => ({
            ...provided,
            fontSize: '0.875rem',
            lineHeight: '1rem',
            color: '#FFFFFF',
        }),
        menu: provided => ({
            ...provided,
            borderRadius: '0.125rem',
            border: '0.125rem solid #727273',
            backgroundColor: '#161616',
        }),
        menuList: provided => ({
            ...provided,
            padding: '0',
            overflowX: 'hidden',
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#ddda2a' : '#161616',
            color: state.isSelected ? '#161616' : '#FFFFFF',
            ':hover': {
                backgroundColor: '#ddda2a',
                color: '#161616',
            },
            borderBottom: '0.0625rem solid #727273',
            ':last-child': {
                borderBottom: '0',
            },
        }),
        dropdownIndicator: provided => ({
            ...provided,
            padding: '0.125rem',
            margin: '0 0 0 0.375rem',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            ':hover': {
                backgroundColor: '#ddda2a80',
            },
        }),
        indicatorSeparator: provided => ({
            ...provided,
            margin: '0',
            backgroundColor: '#727273',
        }),
    };

    switch (variant) {
        case 'chapter':
            return {
                ...baseStyles,
                multiValueLabel: provided => ({
                    ...provided,
                    borderBottom: '0.0625rem solid #ddda2a',
                    fontSize: '0.875rem',
                    lineHeight: '1rem',
                    color: '#FFFFFF',
                }),
                menu: provided => ({
                    ...provided,
                    borderRadius: '0',
                    borderTopRightRadius: '0.0625rem',
                    borderTopLeftRadius: '0.0625rem',
                    border: '0.0625rem solid #727273',
                    backgroundColor: '#2525266',
                    boxShadow: '0 0 0 0',
                }),
                dropdownIndicator: provided => ({
                    ...provided,
                    padding: '0.125rem',
                    margin: '0 0 0 0.375rem',
                    rotate: '180deg',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                    ':hover': {
                        backgroundColor: '#ddda2a80',
                    },
                }),
            };
        case 'rating':
            return {
                control: (provided, state) => ({
                    ...provided,
                    backgroundColor: '#252526',
                    border: '0.0625rem solid #727273',
                    borderRadius: '0.125rem',
                    padding: '0 0.25rem',
                    fontSize: '0.875rem',
                    minHeight: '2.25rem',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: '#161616',
                    },
                    ...(state.isFocused && {
                        backgroundColor: '#161616',
                    }),
                }),
                menu: provided => ({
                    ...provided,
                    backgroundColor: '#161616',
                    border: '0.0625rem solid #727273',
                    borderRadius: '0.125rem',
                    boxShadow: '0 0.25rem 0.5rem rgba(0,0,0,0.1)',
                    zIndex: 9999,
                }),
                option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.isSelected
                        ? '#ddda2a'
                        : state.isFocused
                          ? '#252526'
                          : '#161616',
                    color: state.isSelected ? '#161616' : '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    padding: '0.5rem 0.75rem',
                    '&:hover': {
                        backgroundColor: state.isSelected
                            ? '#ddda2a'
                            : '#252526',
                    },
                    borderBottom: '0.0625rem solid #727273',
                    ':last-child': {
                        borderBottom: '0',
                    },
                }),
                singleValue: provided => ({
                    ...provided,
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                }),
                placeholder: provided => ({
                    ...provided,
                    color: '#727273',
                    fontSize: '0.875rem',
                }),
                dropdownIndicator: provided => ({
                    ...provided,
                    color: '#FFFFFF',
                    '&:hover': {
                        color: '#ddda2a',
                    },
                }),
                indicatorSeparator: () => ({
                    display: 'none',
                }),
                valueContainer: provided => ({
                    ...provided,
                    padding: '0',
                }),
                input: provided => ({
                    ...provided,
                    margin: '0 0 0 0.25rem',
                    padding: '0',
                    color: '#FFFFFF',
                }),
                menuList: provided => ({
                    ...provided,
                    padding: '0',
                    overflowX: 'hidden',
                    maxHeight: '15rem',
                    overflowY: 'auto',
                }),
            };
        default:
            return baseStyles;
    }
};

const Select = ({
    variant = 'default',
    customStyles,
    menuPlacement = 'auto',
    ...props
}: SelectProps) => {
    const variantStyles = getVariantStyles(variant);

    const finalStyles = customStyles
        ? { ...variantStyles, ...customStyles }
        : variantStyles;

    return (
        <ReactSelect
            menuPlacement={menuPlacement}
            {...props}
            styles={finalStyles}
        />
    );
};

export default Select;
