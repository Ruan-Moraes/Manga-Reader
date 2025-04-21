type BlackButtonProps = {
  text: string;
  onClick: () => void;
};

const BlackButton = ({ text, onClick }: BlackButtonProps) => {
  return (
    <button
      className={`px-3 py-2 text-xs rounded-xs shadow-lg bg-primary-default`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default BlackButton;
