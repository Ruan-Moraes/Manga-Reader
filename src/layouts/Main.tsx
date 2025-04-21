type MainTypes = {
  className?: string;
  children: React.ReactNode;
};

const Main = ({ children, className }: MainTypes) => {
  return (
    <main className={`flex flex-col gap-6 p-4 mobile-md:py-8 ${className}`}>
      {children}
    </main>
  );
};

export default Main;
