import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

type RadioInputTypes<T> = {
  fieldName: string;
  onChange: (newValue: T) => void;
  defaultValue?: boolean;
  className?: string;
  value: T;
  labelText: string;
};

const RadioInput = <T extends string | number | readonly string[] | undefined>({
  fieldName,
  onChange,
  defaultValue,
  className,
  value,
  labelText,
}: RadioInputTypes<T>) => {
  const [searchParams] = useSearchParams();

  const inputRef = useRef<HTMLInputElement>(null);

  const changeClasses = useCallback(() => {
    const parentElement = inputRef!.current!.parentNode as HTMLElement;

    parentElement.classList.remove('border-tertiary', 'bg-secondary');
    parentElement.classList.add(
      'border-quaternary-default',
      'bg-quaternary-opacity-25'
    );
  }, []);

  const removeClassesFromAllElements = useCallback(() => {
    const allInputRefs = Array.from(
      document.querySelectorAll(`input[name=${fieldName}]`)
    );

    allInputRefs.forEach((input) => {
      const parentElement = input.parentNode as HTMLElement;

      parentElement.classList.remove(
        'border-quaternary-default',
        'bg-quaternary-opacity-25'
      );
      parentElement.classList.add('border-tertiary', 'bg-secondary');
    });
  }, [fieldName]);

  const handleChange = useCallback(() => {
    onChange(inputRef!.current!.value as T);

    removeClassesFromAllElements();

    changeClasses();
  }, [onChange, changeClasses, removeClassesFromAllElements]);

  useEffect(() => {
    if (fieldName && searchParams.has(fieldName)) {
      const sort = searchParams.get(fieldName);

      if (sort?.includes(value!.toString())) {
        handleChange();
      }

      return;
    }

    if (defaultValue) {
      handleChange();

      return;
    }
  }, [defaultValue, handleChange, searchParams, fieldName, value]);

  return (
    <div {...(className ? { className } : {})}>
      <label className="relative flex items-center justify-center h-12 text-sm text-center transition-colors duration-300 border rounded-sm cursor-pointer hover:bg-quaternary-opacity-25 bg-secondary border-tertiary">
        <input
          className="absolute top-0 bottom-0 left-0 right-0 appearance-none cursor-pointer "
          name={fieldName}
          onChange={handleChange}
          ref={inputRef}
          type="radio"
          value={value}
        />
        <span className="px-2 font-bold text-shadow-default">{labelText}</span>
      </label>
    </div>
  );
};

export default RadioInput;
