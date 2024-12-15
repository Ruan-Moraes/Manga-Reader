type ParagraphsSection = {
  children: React.ReactNode;
};

const ParagraphsSection = ({ children }: ParagraphsSection) => {
  return <section className="flex flex-col gap-4">{children}</section>;
};

export default ParagraphsSection;
