type MainTypes = {
    className?: string;
    children: React.ReactNode;
};

const MainContent = ({ children, className }: MainTypes) => {
    return (
        <main
            className={`flex flex-col gap-6 p-4 mobile-md:py-8 lg:max-w-6xl lg:mx-auto ${className ? className : ''}`}
        >
            {children}
        </main>
    );
};

export default MainContent;
