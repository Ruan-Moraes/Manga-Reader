type MainTypes = {
  className?: string;
  children: React.ReactNode;
};

const Main = ({ children, className }: MainTypes) => {
  return (
    <main
      className={`flex flex-col gap-6 px-2 py-4 mobile-md:py-8 mobile-md:px-4 ${className}`}
    >
      {children}
    </main>
  );
};

export default Main;
