type RaisedButtonProps = {
  onClick?: () => void;
  text: string;
};

// Todo: Refactor this component

const RaisedButton = ({ onClick, text }: RaisedButtonProps) => {
  return (
    <button
      {...(onClick && { onClick })}
      className="w-full h-10 px-2 font-bold transition duration-300 border rounded-sm shadow-elevated border-tertiary text-shadow-highlight hover:shadow-none outline-1 outline-transparent outline hover:outline-tertiary hover:font-extrabold"
    >
      {text}
    </button>
  );
};

export default RaisedButton;
