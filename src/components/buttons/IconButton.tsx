type IconButtonProps = {
  onClick: () => void;

  children?: React.ReactNode;
};

const IconButton = ({ onClick, children }: IconButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1 transition-colors duration-300 rounded-sm bg-primary-default hover:bg-quaternary-opacity-25"
    >
      {children}
    </button>
  );
};

export default IconButton;
