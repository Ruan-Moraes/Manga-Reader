type ParagraphBlock = {
  children: React.ReactNode;
};

const ParagraphBlock = ({ children }: ParagraphBlock) => {
  return <section className="flex flex-col gap-4">{children}</section>;
};

export default ParagraphBlock;
