interface IMain {
  children: React.ReactNode;
}

const Main = ({ children }: IMain) => {
  return <main className="flex flex-col gap-8 p-4 py-8">{children}</main>;
};

export default Main;
