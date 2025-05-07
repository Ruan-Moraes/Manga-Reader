type CloseButtonProps = {
  onClick: () => void;
  text: string;
};

const CloseButton = ({ onClick, text }: CloseButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 text-xs font-bold rounded-xs shadow-lg bg-primary-default"
    >
      {text}
    </button>
  );
};

export default CloseButton;
