import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StyledSelect, { MultiValue } from 'react-select';

import { useFloatingPortalContainer } from '@ui/FloatingPortalContext';
import { Tag } from '../model/tag.types';

type TagSelectInputProps = {
    onChange: (newValue: Tag[]) => void;
    urlParameterName?: string;
    options?: Tag[];
    placeholder: string;
};

const TagSelectInput = ({ urlParameterName, options, onChange, placeholder }: TagSelectInputProps) => {
    const { t } = useTranslation('category');
    const [searchParams] = useSearchParams();
    const [selectedValues, setSelectedValues] = useState<Tag[]>([]);
    // Dentro de um Modal (<dialog> na top layer), o menu precisa portalar para o próprio dialog.
    const portalContainer = useFloatingPortalContainer();

    useEffect(() => {
        if (!urlParameterName) {
            setSelectedValues([]);

            return;
        }

        const updateDefaultValues = async () => {
            if (searchParams.has(urlParameterName)) {
                const tags = searchParams.get(urlParameterName)?.split(',');

                if (tags) {
                    const upperCaseTags = tags.map(tag => tag.trim().toUpperCase());

                    const selectedTags = options?.filter(option => upperCaseTags.includes(option.label.toUpperCase()));

                    if (selectedTags) {
                        setSelectedValues(selectedTags);

                        onChange(selectedTags);
                    }
                }
            }

            if (!searchParams.has(urlParameterName)) {
                setSelectedValues([]);

                onChange([]);
            }
        };

        updateDefaultValues();
    }, [searchParams, options, onChange, urlParameterName]);

    const handleChange = (newValue: MultiValue<Tag>) => {
        setSelectedValues(newValue as Tag[]);

        onChange(newValue as Tag[]);
    };

    return (
        <div>
            <StyledSelect
                blurInputOnSelect={false}
                closeMenuOnSelect={false}
                isMulti
                noOptionsMessage={() => t('tagSelect.loading')}
                onChange={handleChange}
                options={options}
                value={selectedValues}
                placeholder={placeholder}
                menuPortalTarget={portalContainer ?? undefined}
                menuPosition={portalContainer ? 'fixed' : 'absolute'}
                styles={{
                    menuPortal: baseStyles => ({
                        ...baseStyles,
                        zIndex: 'var(--z-mr-dropdown)' as unknown as number,
                    }),
                    control: (baseStyles, state) => ({
                        ...baseStyles,
                        padding: '0.25rem',
                        minHeight: '2.75rem',
                        backgroundColor: 'var(--mr-primary)',
                        borderRadius: '4px',
                        border: `1px solid ${state.isFocused ? 'var(--mr-accent)' : 'var(--mr-border)'}`,
                        boxShadow: state.isFocused ? '0 0 0 2px var(--mr-accent-25)' : 'none',
                        color: 'var(--mr-fg)',
                        cursor: 'text',
                        transition: 'border-color 150ms, box-shadow 150ms',
                        ':hover': {
                            borderColor: state.isFocused ? 'var(--mr-accent)' : 'var(--mr-gray-500)',
                        },
                    }),
                    placeholder: baseStyles => ({
                        ...baseStyles,
                        fontSize: '0.875rem',
                        lineHeight: '1rem',
                        color: 'var(--mr-tertiary)',
                    }),
                    valueContainer: baseStyles => ({
                        ...baseStyles,
                        padding: '0',
                    }),
                    input: baseStyles => ({
                        ...baseStyles,
                        margin: '0 0 0 0.25rem',
                        padding: '0',
                        color: 'var(--mr-fg)',
                    }),
                    multiValue: baseStyles => ({
                        ...baseStyles,
                        margin: '0.125rem',
                        padding: '0.125rem 0.25rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--mr-accent-10)',
                        border: '1px solid var(--mr-accent-25)',
                        transition: 'background-color 150ms',
                        ':hover': {
                            backgroundColor: 'var(--mr-accent-25)',
                        },
                    }),
                    multiValueLabel: baseStyles => ({
                        ...baseStyles,
                        fontSize: '0.8125rem',
                        lineHeight: '1rem',
                        color: 'var(--mr-fg)',
                    }),
                    multiValueRemove: baseStyles => ({
                        ...baseStyles,
                        borderRadius: '2px',
                        color: 'var(--mr-fg-subtle)',
                        cursor: 'pointer',
                        ':hover': {
                            backgroundColor: 'var(--mr-accent)',
                            color: 'var(--mr-primary)',
                        },
                    }),
                    menu: baseStyles => ({
                        ...baseStyles,
                        borderRadius: '8px',
                        border: '1px solid var(--mr-border)',
                        backgroundColor: 'var(--mr-gray-900)',
                        boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.7)',
                        overflow: 'hidden',
                    }),
                    menuList: baseStyles => ({
                        ...baseStyles,
                        padding: '0.375rem',
                        overflowX: 'hidden',
                    }),
                    option: (baseStyles, state) => ({
                        ...baseStyles,
                        borderRadius: '4px',
                        backgroundColor: state.isSelected ? 'var(--mr-accent)' : state.isFocused ? 'var(--mr-accent-25)' : 'transparent',
                        color: state.isSelected ? 'var(--mr-primary)' : 'var(--mr-fg)',
                        cursor: 'pointer',
                        ':hover': {
                            backgroundColor: state.isSelected ? 'var(--mr-accent)' : 'var(--mr-accent-25)',
                        },
                    }),
                    indicatorSeparator: baseStyles => ({
                        ...baseStyles,
                        margin: '6px 0',
                        height: 'calc(100% - 12px)',
                        backgroundColor: 'var(--mr-border-subtle)',
                    }),
                    dropdownIndicator: baseStyles => ({
                        ...baseStyles,
                        padding: '0.125rem',
                        margin: '0 0.25rem 0 0.25rem',
                        borderRadius: '4px',
                        color: 'var(--mr-fg-subtle)',
                        cursor: 'pointer',
                        transition: 'color 150ms, background-color 150ms',
                        ':hover': {
                            backgroundColor: 'var(--mr-accent-25)',
                            color: 'var(--mr-fg)',
                        },
                    }),
                    clearIndicator: baseStyles => ({
                        ...baseStyles,
                        padding: '0.125rem',
                        borderRadius: '4px',
                        color: 'var(--mr-fg-subtle)',
                        cursor: 'pointer',
                        ':hover': {
                            backgroundColor: 'rgba(255, 120, 79, 0.15)',
                            color: 'var(--mr-danger)',
                        },
                    }),
                }}
            />
        </div>
    );
};

export default TagSelectInput;
