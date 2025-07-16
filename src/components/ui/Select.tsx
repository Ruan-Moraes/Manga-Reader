import React from 'react';
import ReactSelect, { Props as ReactSelectProps, StylesConfig } from 'react-select';

export interface SelectOption {
    value: string | number;
    label: string;
    isDisabled?: boolean;
}

export type SelectVariant = 'default' | 'chapter' | 'rating';

export interface SelectProps extends Omit<ReactSelectProps<SelectOption>, 'styles'> {
    variant?: SelectVariant;
    menuPlacement?: 'auto' | 'bottom' | 'top';
    customStyles?: StylesConfig<SelectOption>;
}

const getVariantStyles = (variant: SelectVariant): StylesConfig<SelectOption> => {
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
        placeholder: (provided) => ({
            ...provided,
            fontSize: '0.875rem',
            lineHeight: '1rem',
            color: '#FFFFFF',
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: '0',
        }),
        input: (provided) => ({
            ...provided,
            margin: '0 0 0 0.25rem',
            padding: '0',
            color: '#FFFFFF',
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#FFFFFF',
        }),
        multiValue: (provided) => ({
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
        multiValueLabel: (provided) => ({
            ...provided,
            fontSize: '0.875rem',
            lineHeight: '1rem',
            color: '#FFFFFF',
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '0.125rem',
            border: '0.125rem solid #727273',
            backgroundColor: '#161616',
        }),
        menuList: (provided) => ({
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
        dropdownIndicator: (provided) => ({
            ...provided,
            padding: '0.125rem',
            margin: '0 0 0 6px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            ':hover': {
                backgroundColor: '#ddda2a80',
            },
        }),
        indicatorSeparator: (provided) => ({
            ...provided,
            margin: '0',
            backgroundColor: '#727273',
        }),
    };

    switch (variant) {
        case 'chapter':
            return {
                ...baseStyles,
                multiValueLabel: (provided) => ({
                    ...provided,
                    borderBottom: '0.0625rem solid #ddda2a',
                    fontSize: '0.875rem',
                    lineHeight: '1rem',
                    color: '#FFFFFF',
                }),
                menu: (provided) => ({
                    ...provided,
                    borderRadius: '0',
                    borderTopRightRadius: '0.0625rem',
                    borderTopLeftRadius: '0.0625rem',
                    border: '0.0625rem solid #727273',
                    backgroundColor: '#2525266',
                    boxShadow: '0 0 0 0',
                }),
                dropdownIndicator: (provided) => ({
                    ...provided,
                    padding: '0.125rem',
                    margin: '0 0 0 6px',
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
                    backgroundColor: 'var(--color-tertiary)',
                    border: '1px solid var(--color-tertiary)',
                    borderRadius: '6px',
                    padding: '0px 4px',
                    fontSize: '14px',
                    minHeight: '36px',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: 'var(--color-secondary)',
                        borderColor: 'var(--color-secondary)',
                    },
                    ...(state.isFocused && {
                        borderColor: 'var(--color-primary)',
                        outline: '2px solid rgba(var(--color-primary-rgb), 0.3)',
                        outlineOffset: '0px',
                    }),
                }),
                menu: (provided) => ({
                    ...provided,
                    backgroundColor: 'var(--color-tertiary)',
                    border: '1px solid var(--color-tertiary)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    zIndex: 9999,
                }),
                option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.isSelected
                        ? 'var(--color-primary)'
                        : state.isFocused
                        ? 'var(--color-secondary)'
                        : 'var(--color-tertiary)',
                    color: state.isSelected ? 'white' : 'var(--color-text)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '8px 12px',
                    '&:hover': {
                        backgroundColor: state.isSelected
                            ? 'var(--color-primary)'
                            : 'var(--color-secondary)',
                    },
                }),
                singleValue: (provided) => ({
                    ...provided,
                    color: 'var(--color-text)',
                    fontSize: '14px',
                }),
                placeholder: (provided) => ({
                    ...provided,
                    color: 'var(--color-text-muted)',
                    fontSize: '14px',
                }),
                dropdownIndicator: (provided) => ({
                    ...provided,
                    color: 'var(--color-text)',
                    '&:hover': {
                        color: 'var(--color-primary)',
                    },
                }),
                indicatorSeparator: () => ({
                    display: 'none',
                }),
                valueContainer: (provided) => ({
                    ...provided,
                    padding: '0',
                }),
                input: (provided) => ({
                    ...provided,
                    margin: '0 0 0 0.25rem',
                    padding: '0',
                    color: 'var(--color-text)',
                }),
                menuList: (provided) => ({
                    ...provided,
                    padding: '0',
                    overflowX: 'hidden',
                }),
            };

        default:
            return baseStyles;
    }
};

const Select: React.FC<SelectProps> = ({
    variant = 'default',
    customStyles,
    menuPlacement = 'auto',
    ...props
}) => {
    const variantStyles = getVariantStyles(variant);
    const finalStyles = customStyles 
        ? { ...variantStyles, ...customStyles }
        : variantStyles;

    return (
        <ReactSelect
            {...props}
            styles={finalStyles}
            menuPlacement={menuPlacement}
        />
    );
};

export default Select;