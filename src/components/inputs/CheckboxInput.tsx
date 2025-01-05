import CustomLinkBase from '../links/elements/CustomLinkBase';

type CheckboxInputProps = {
  labelText: string;
  href: string;
  linkText: string;
};

const CheckboxInput = ({ labelText, href, linkText }: CheckboxInputProps) => {
  return (
    <div>
      <label className="flex items-center gap-2 w-max">
        <div className="relative w-5 h-5">
          <input
            className="w-full h-full transition duration-300 border rounded-sm appearance-none cursor-pointer border-tertiary checked:bg-quaternary-opacity-5 peer checked:bg-quaternary-opacity-50"
            name="checkboxInput"
            type="checkbox"
          />
          <div className="absolute transition duration-300 transform -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none top-1/2 left-1/2 peer peer-checked:opacity-100">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                fillRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <p className="text-sm cursor-pointer">
          <span>{labelText}</span>{' '}
          <span>
            <CustomLinkBase
              href={href}
              className="font-bold underline"
              text={linkText}
            />
          </span>
        </p>
      </label>
    </div>
  );
};

export default CheckboxInput;
