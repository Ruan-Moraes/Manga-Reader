type ParagraphContainer = {
    children: React.ReactNode;
};

const ParagraphContainer = ({ children }: ParagraphContainer) => {
    return <section className="flex flex-col gap-4">{children}</section>;
};

export default ParagraphContainer;
