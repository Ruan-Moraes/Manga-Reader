interface ISectionTitle {
  title: string;
  sub?: string;
}

const SectionTitle = ({ title, sub }: ISectionTitle) => {
  return (
    <div>
      <h2 className="flex flex-col">
        <span className="text-2xl font-bold">{title}</span>
        {sub && <span className="text-xs text-quaternary-default">{sub}</span>}
      </h2>
    </div>
  );
};

export default SectionTitle;
