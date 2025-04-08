type BaseButtonProps = {
  onClick?: () => void;
  text: string;
};

// Todo: Refactor this component

const BaseButton = ({ onClick, text }: BaseButtonProps) => {
  return (
    <button
      {...(onClick && { onClick })}
      className="w-full p-2 font-bold transition duration-300 border rounded-sm bg-secondary border-tertiary text-shadow-highlight hover:font-extrabold"
    >
      {text}
    </button>
  );
};

export default BaseButton;
