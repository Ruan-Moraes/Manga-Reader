import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

type RadioInputTypes<T> = {
    onChange: (newValue: T) => void;
    className?: string;
    fieldName: string;
    defaultValue?: boolean;
    value: T;
    labelText: string;
};

const RadioInput = <T extends string | number | readonly string[] | undefined>({
    onChange,
    className,
    fieldName,
    defaultValue,
    value,
    labelText,
}: RadioInputTypes<T>) => {
    const [searchParams] = useSearchParams();

    const inputRef = useRef<HTMLInputElement>(null);

    const removeClassesFromAllElements = useCallback(() => {
        const allInputRefs = Array.from(
            document.querySelectorAll(`input[name=${fieldName}]`),
        );

        allInputRefs.forEach(input => {
            const parentElement = input.parentNode as HTMLElement;

            parentElement.classList.remove(
                'border-quaternary-default',
                'bg-quaternary-opacity-25',
            );
            parentElement.classList.add('border-tertiary', 'bg-secondary');
        });
    }, [fieldName]);

    const changeClasses = useCallback(() => {
        const parentElement = inputRef!.current!.parentNode as HTMLElement;

        parentElement.classList.remove('border-tertiary', 'bg-secondary');
        parentElement.classList.add(
            'border-quaternary-default',
            'bg-quaternary-opacity-25',
        );
    }, []);

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
            <label className="relative flex items-center justify-center h-10 text-sm text-center transition-colors duration-300 border rounded-xs cursor-pointer hover:bg-quaternary-opacity-25 bg-secondary border-tertiary">
                <input
                    type="radio"
                    value={value}
                    ref={inputRef}
                    name={fieldName}
                    onChange={handleChange}
                    className="absolute top-0 bottom-0 left-0 right-0 appearance-none cursor-pointer "
                />
                <span className="px-2 font-bold text-shadow-default">
                    {labelText}
                </span>
            </label>
        </div>
    );
};

export default RadioInput;
