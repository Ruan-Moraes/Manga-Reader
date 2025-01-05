type MainProps = {
  children: React.ReactNode;
};

const Main = ({ children }: MainProps) => {
  return (
    <main className="flex flex-col gap-6 px-2 py-4 mobile-md:py-8 mobile-md:px-4">
      {children}
    </main>
  );
};

export default Main;
