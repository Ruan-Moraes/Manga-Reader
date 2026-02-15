import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Select, { MultiValue } from 'react-select';

import { TagsTypes } from '../../types/TagsTypes';

type SelectInputTypes = {
    onChange: (newValue: TagsTypes[]) => void;

    urlParameterName?: string;
    options?: TagsTypes[];
    placeholder: string;
};

const SelectInput = ({
    urlParameterName,
    options,
    onChange,
    placeholder,
}: SelectInputTypes) => {
    const [searchParams] = useSearchParams();
    const [selectedValues, setSelectedValues] = useState<TagsTypes[]>([]);

    useEffect(() => {
        if (!urlParameterName) {
            setSelectedValues([]);

            return;
        }

        const updateDefaultValues = async () => {
            if (searchParams.has(urlParameterName)) {
                const tags = searchParams.get(urlParameterName)?.split(',');

                if (tags) {
                    const upperCaseTags = tags.map(tag =>
                        tag.trim().toUpperCase(),
                    );

                    const selectedTags = options?.filter(option =>
                        upperCaseTags.includes(option.label.toUpperCase()),
                    );

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

    const handleChange = (newValue: MultiValue<TagsTypes>) => {
        setSelectedValues(newValue as TagsTypes[]);

        onChange(newValue as TagsTypes[]);
    };

    return (
        <div>
            <Select
                blurInputOnSelect={false}
                closeMenuOnSelect={false}
                isMulti
                noOptionsMessage={() => 'Carregando...'}
                onChange={handleChange}
                options={options}
                value={selectedValues}
                placeholder={placeholder}
                styles={{
                    control: (baseStyles, state) => ({
                        ...baseStyles,
                        padding: '0 0.5rem',
                        height: '2.5rem',
                        backgroundColor: '#727273',
                        borderRadius: '0.125rem',
                        border: 'none',
                        boxShadow: state.isFocused
                            ? '0 0 0.075rem 0.25rem #ddda2a40'
                            : '0.25rem 0.25rem 0 0 #ddda2a40',
                        color: '#FFFFFF',
                        cursor: 'text',
                        transition: 'box-shadow 0.3s',
                        ':hover': {
                            boxShadow: '0 0 0.075rem 0.25rem #ddda2a40',
                        },
                    }),
                    placeholder: baseStyles => ({
                        ...baseStyles,
                        fontSize: '0.875rem',
                        lineHeight: '1rem',
                        color: '#161616',
                    }),
                    valueContainer: baseStyles => ({
                        ...baseStyles,
                        padding: '0',
                    }),
                    input: baseStyles => ({
                        ...baseStyles,
                        margin: '0 0 0 0.25rem',
                        padding: '0',
                        color: '#FFFFFF',
                    }),
                    multiValue: baseStyles => ({
                        ...baseStyles,
                        margin: '0.125rem',
                        padding: '0.25rem',
                        borderRadius: '0.125rem',
                        backgroundColor: '#161616',
                        transition: 'background-color 0.3s',
                        ':hover': {
                            backgroundColor: '#161616bf',
                        },
                    }),
                    multiValueLabel: baseStyles => ({
                        ...baseStyles,
                        fontSize: '0.875rem',
                        lineHeight: '1rem',
                        color: '#FFFFFF',
                    }),
                    multiValueRemove: baseStyles => ({
                        ...baseStyles,
                        padding: '0 0.25rem',
                        borderRadius: '0.125rem',
                        fontSize: '0.875rem',
                        lineHeight: '1rem',
                        color: '#FFFFFF',
                        ':hover': {
                            backgroundColor: '#ddda2a80',
                        },
                        transition: 'background-color 0.3s',
                    }),
                    menu: baseStyles => ({
                        ...baseStyles,
                        borderRadius: '0.125rem',
                        border: '0.125rem solid #727273',
                        backgroundColor: '#161616',
                    }),
                    menuList: baseStyles => ({
                        ...baseStyles,
                        padding: '0',
                        overflowX: 'hidden',
                    }),
                    option: (baseStyles, state) => ({
                        ...baseStyles,
                        backgroundColor: state.isSelected
                            ? '#ddda2a'
                            : '#161616',
                        color: state.isSelected ? '#161616' : '#FFFFFF',
                        ':hover': {
                            backgroundColor: '#ddda2a',
                            color: '#161616',
                        },
                    }),

                    clearIndicator: () => ({
                        padding: '0.125rem',
                        margin: '0 0.5rem 0 0',
                        borderRadius: '0.125rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                        ':hover': {
                            backgroundColor: '#ddda2a80',
                        },
                    }),
                    indicatorSeparator: baseStyles => ({
                        ...baseStyles,
                        margin: '6px 0',
                        height: 'calc(100% - 10px)',
                        backgroundColor: '#252526',
                    }),
                    dropdownIndicator: baseStyles => ({
                        ...baseStyles,
                        padding: '0.125rem',
                        margin: '0 0 0 0.5rem',
                        borderRadius: '0.125rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                        ':hover': {
                            backgroundColor: '#ddda2a80',
                        },
                    }),
                }}
            />
        </div>
    );
};

export default SelectInput;
