interface ILinkBox {
  children: React.ReactNode;
}

const LinkBox = ({ children }: ILinkBox) => {
  return (
    <nav className="flex flex-col px-2 text-sm text-center border-2 border-t-0 rounded-sm rounded-t-none bg-primary-default border-tertiary text-shadow-default">
      {children}
    </nav>
  );
};

export default LinkBox;
