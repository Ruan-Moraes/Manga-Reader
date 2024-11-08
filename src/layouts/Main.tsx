interface IBody {
  children: React.ReactNode;
}

const Body = ({ children }: IBody) => {
  return <main className="flex flex-col gap-8 p-4 py-8">{children}</main>;
};

export default Body;
