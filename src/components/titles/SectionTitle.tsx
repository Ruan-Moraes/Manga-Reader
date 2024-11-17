interface ISectionTitle {
  title: string;
  sub?: string;
}

const SectionTitle = ({ title, sub }: ISectionTitle) => {
  return (
    <div>
      <h2 className="flex flex-col items-start justify-between">
        <span className="text-2xl font-bold">{title}</span>
        <a className="text-xs text-quaternary-default">{sub}</a>
      </h2>
    </div>
  );
};

export default SectionTitle;
