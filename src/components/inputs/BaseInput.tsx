interface IBaseInput {
  label: string;
  type: string;
  placeholder: string;
}

const BaseInput = ({ label, type, placeholder }: IBaseInput) => {
  return (
    <div>
      <label className="flex flex-col gap-1 ">
        <span className="text-xs font-bold">{label}</span>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full p-2 transition-shadow duration-500 border-none rounded-sm outline-none appearance-none bg-tertiary placeholder-primary-default placeholder:text-sm shadow-default focus:shadow-inside hover:shadow-inside"
        />
      </label>
    </div>
  );
};

export default BaseInput;
