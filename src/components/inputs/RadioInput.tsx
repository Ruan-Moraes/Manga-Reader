import { useEffect } from 'react';

import { SortTypes } from '../../types/SortTypes';
import { StatusTypes } from '../../types/StatusTypes';
import { AdultContentTypes } from '../../types/AdultContentTypes';

type RadioInputProps = {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  refElement: React.MutableRefObject<HTMLInputElement[]>;
  defaultValue?: boolean;
  index: number;
  className?: string;
  fieldName: string;
  value: SortTypes | StatusTypes | AdultContentTypes;
  labelText: string;
};

const RadioInput = ({
  onChange,
  refElement,
  defaultValue,
  index,
  className,
  fieldName,
  value,
  labelText,
}: RadioInputProps) => {
  useEffect(() => {
    if (refElement.current[0] && defaultValue) {
      const parent = refElement.current[defaultValue ? index : 0]
        .parentNode as HTMLElement;

      parent.classList.remove('border-tertiary', 'bg-secondary');
      parent.classList.add(
        'border-quaternary-default',
        'bg-quaternary-opacity-25'
      );
    }
  }, [refElement, defaultValue, index]);

  return (
    <div {...(className ? { className } : {})}>
      <label className="relative flex items-center justify-center h-12 text-sm text-center transition-colors duration-300 border-2 rounded-sm bg-secondary border-tertiary">
        <input
          onChange={onChange}
          ref={(inputRef) => {
            if (inputRef) {
              refElement.current[index] = inputRef as HTMLInputElement;
            }
          }}
          type="radio"
          name={fieldName}
          value={value}
          className="absolute top-0 bottom-0 left-0 right-0 appearance-none"
        />
        <span className="px-2 font-bold text-shadow-default">{labelText}</span>
      </label>
    </div>
  );
};

export default RadioInput;
