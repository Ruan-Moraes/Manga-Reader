import { Link } from 'react-router-dom';

interface ICheckboxInput {
  labelText: string;
  linkText: string;
  linkTo: string;
}

const CheckboxInput = ({ labelText, linkText, linkTo }: ICheckboxInput) => {
  return (
    <div>
      <label className="flex items-center gap-2">
        <div className="relative w-5 h-5">
          <input
            type="checkbox"
            name="checkboxInput"
            className="w-full h-full transition duration-500 border rounded-sm appearance-none cursor-pointer border-tertiary checked:bg-quaternary-opacity-50 peer peer-"
          />
          <div className="absolute transition duration-500 transform -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none top-1/2 left-1/2 peer peer-checked:opacity-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <p className="text-sm">
          <span>{labelText}</span>{' '}
          <span>
            <Link
              to={linkTo}
              className="font-bold underline text-tertiary-default text-shadow-highlight"
            >
              {linkText}
            </Link>
          </span>
        </p>
      </label>
    </div>
  );
};

export default CheckboxInput;
