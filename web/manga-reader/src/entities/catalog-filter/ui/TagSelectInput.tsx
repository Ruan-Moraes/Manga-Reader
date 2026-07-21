import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Select } from '@ui/Select';
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

    const selectOptions = useMemo(() => (options ?? []).map(tag => ({ value: String(tag.value), label: tag.label })), [options]);

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

    const handleChange = (newValues: string[]) => {
        const newSelectedValues = (options ?? []).filter(tag => newValues.includes(String(tag.value)));

        setSelectedValues(newSelectedValues);

        onChange(newSelectedValues);
    };

    return (
        <Select
            multiple
            options={selectOptions}
            value={selectedValues.map(tag => String(tag.value))}
            onChange={handleChange}
            placeholder={placeholder}
            searchPlaceholder={t('tagSelect.searchPlaceholder')}
            noOptionsMessage={options === undefined ? t('tagSelect.loading') : t('tagSelect.noResults')}
        />
    );
};

export default TagSelectInput;
