import { useEffect } from 'react';
import { SortTypes } from '../../types/SortTypes';

type RadioInputProps = {
  text: string;
  value: SortTypes;
  index: number;

  handleSortChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedSortRefs: React.MutableRefObject<HTMLInputElement[]>;
};

const RadioInput = ({
  text,
  value,
  index,
  handleSortChange,
  selectedSortRefs,
}: RadioInputProps) => {
  useEffect(() => {
    if (selectedSortRefs.current[0]) {
      const parent = selectedSortRefs.current[0].parentNode as HTMLElement;

      parent.classList.remove('border-tertiary', 'bg-secondary');
      parent.classList.add(
        'border-quaternary-default',
        'bg-quaternary-opacity-25'
      );
    }
  }, [selectedSortRefs]);

  return (
    <div>
      <label className="relative flex items-center justify-center h-12 text-sm text-center transition-colors duration-300 border-2 rounded-sm bg-secondary border-tertiary">
        <input
          onChange={handleSortChange}
          ref={(ref) =>
            (selectedSortRefs.current[index] = ref as HTMLInputElement)
          }
          type="radio"
          name="sort"
          value={value}
          className="absolute top-0 bottom-0 left-0 right-0 appearance-none"
        />
        <span className="px-2 font-bold text-shadow-default">{text}</span>
      </label>
    </div>
  );
};

export default RadioInput;
