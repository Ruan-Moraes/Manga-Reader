type BaseButtonTypes = {
  onClick?: () => void;
  text: string;
};

const BaseButton = ({ onClick, text }: BaseButtonTypes) => {
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
