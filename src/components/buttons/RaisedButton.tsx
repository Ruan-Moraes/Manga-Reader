type RaisedButtonProps = {
  onClick?: () => void;
  text: string;
};

// TODO: Refatora esse componente

const RaisedButton = ({ onClick, text }: RaisedButtonProps) => {
  return (
    <button
      {...(onClick && { onClick })}
      className="w-full h-10 px-2 font-bold transition duration-300 border rounded-xs shadow-elevated border-tertiary text-shadow-highlight hover:shadow-none outline-1 outline-transparent hover:outline-tertiary hover:font-extrabold"
    >
      {text}
    </button>
  );
};

export default RaisedButton;
