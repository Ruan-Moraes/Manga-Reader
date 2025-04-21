import clsx from 'clsx';

type IconButtonProps = {
  onClick: () => void;
  children?: React.ReactNode;
  className?: string;
};

const IconButton = ({ onClick, children, className }: IconButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 transition-colors duration-300 rounded-xs bg-primary-default hover:bg-quaternary-opacity-25
        ${clsx(!className && 'py-1', className && className)}
        `}
    >
      {children}
    </button>
  );
};

export default IconButton;
