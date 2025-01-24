type LinkBoxTypes = {
  children: React.ReactNode;
  className?: string;
};

const LinkBox = ({ children, className }: LinkBoxTypes) => {
  return (
    <div
      className={`text-center duration-300 border rounded-sm bg-secondary border-tertiary hover:bg-quaternary-opacity-50 ${className}`}
    >
      {children}
    </div>
  );
};

export default LinkBox;
