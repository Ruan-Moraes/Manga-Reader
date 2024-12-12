import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import Select from 'react-select';

import { TagsTypes } from '../../types/TagsTypes';

type SelectInputProps = {
  options: TagsTypes[] | undefined;
  placeholder: string;
  onChange: (newValue: TagsTypes[]) => void;
};

const SelectInput = ({ options, placeholder, onChange }: SelectInputProps) => {
  const location = useLocation();
  const [query, setQuery] = useState<TagsTypes[]>([]);

  return (
    <div>
      <form>
        <Select
          isMulti
          value={query}
          options={options}
          onChange={onChange}
          noOptionsMessage={() => null}
          blurInputOnSelect={false}
          closeMenuOnSelect={false}
          placeholder={placeholder}
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              padding: '0.5rem',
              backgroundColor: '#727273',
              borderRadius: '0.125rem',
              border: 'none',
              boxShadow: state.isFocused
                ? '0 0 0.075rem 0.25rem #ddda2a40'
                : '0.25rem 0.25rem 0 0 #ddda2a40',
              color: '#FFFFFF',
              cursor: 'text',
              transition: 'box-shadow 0.5s',
              ':hover': {
                boxShadow: '0 0 0.075rem 0.25rem #ddda2a40',
              },
            }),
            placeholder: (baseStyles) => ({
              ...baseStyles,
              fontSize: '0.875rem',
              lineHeight: '1rem',
              color: '#161616',
            }),
            valueContainer: (baseStyles) => ({
              ...baseStyles,
              padding: '0',
            }),
            input: (baseStyles) => ({
              ...baseStyles,
              margin: '0 0 0 0.25rem',
              padding: '0',
              color: '#FFFFFF',
            }),
            multiValue: (baseStyles) => ({
              ...baseStyles,
              margin: '0.125rem',
              padding: '0.25rem',
              borderRadius: '0.125rem',
              backgroundColor: '#161616',
              transition: 'background-color 0.5s',
              ':hover': {
                backgroundColor: '#161616bf',
              },
            }),
            multiValueLabel: (baseStyles) => ({
              ...baseStyles,
              fontSize: '0.875rem',
              lineHeight: '1rem',
              color: '#FFFFFF',
            }),
            multiValueRemove: (baseStyles) => ({
              ...baseStyles,
              padding: '0 0.25rem',
              borderRadius: '0.125rem',
              fontSize: '0.875rem',
              lineHeight: '1rem',
              color: '#FFFFFF',
              ':hover': {
                backgroundColor: '#ddda2a80',
              },
              transition: 'background-color 0.5s',
            }),
            menu: (baseStyles) => ({
              ...baseStyles,
              borderRadius: '0.125rem',
              border: '0.125rem solid #727273',
              backgroundColor: '#161616',
            }),
            menuList: (baseStyles) => ({
              ...baseStyles,
              padding: '0',
              overflowX: 'hidden',
            }),
            option: (baseStyles, state) => ({
              ...baseStyles,
              backgroundColor: state.isSelected ? '#ddda2a' : '#161616',
              color: state.isSelected ? '#161616' : '#FFFFFF',
              ':hover': {
                backgroundColor: '#ddda2a',
                color: '#161616',
              },
            }),
            clearIndicator: () => ({
              padding: '0.125rem',
              margin: '0 0.25rem 0 0',
              borderRadius: '0.125rem',
              cursor: 'pointer',
              transition: 'background-color 0.5s',
              ':hover': {
                backgroundColor: '#ddda2a80',
              },
            }),
            dropdownIndicator: (baseStyles) => ({
              ...baseStyles,
              padding: '0.125rem',
              margin: '0 0 0 0.25rem',
              borderRadius: '0.125rem',
              cursor: 'pointer',
              transition: 'background-color 0.5s',
              ':hover': {
                backgroundColor: '#ddda2a80',
              },
            }),
          }}
        />
      </form>
    </div>
  );
};

export default SelectInput;
