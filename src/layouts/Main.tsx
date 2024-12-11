type MainProps = {
  children: React.ReactNode;
};

const Main = ({ children }: MainProps) => {
  return <main className="flex flex-col gap-8 p-4 py-8">{children}</main>;
};

export default Main;
