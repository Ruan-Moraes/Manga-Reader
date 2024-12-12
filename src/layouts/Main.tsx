type MainProps = {
  children: React.ReactNode;
};

const Main = ({ children }: MainProps) => {
  return <main className="flex flex-col gap-6 p-4 py-8">{children}</main>;
};

export default Main;
