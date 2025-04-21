type BaseInputTypes = {
  label: string;
  type: string;
  placeholder: string;
};

const BaseInput = ({ label, type, placeholder }: BaseInputTypes) => {
  return (
    <div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold">{label}</span>
        <input
          className="w-full p-2 transition-shadow duration-300 border-none rounded-xs outline-none appearance-none bg-tertiary placeholder-primary-default placeholder:text-sm shadow-default focus:shadow-inside hover:shadow-inside"
          placeholder={placeholder}
          type={type}
        />
      </label>
    </div>
  );
};

export default BaseInput;
