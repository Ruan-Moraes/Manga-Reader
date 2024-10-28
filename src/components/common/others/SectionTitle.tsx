const SectionTitle = ({ title, sub }: { title: string; sub: string }) => {
  return (
    <div>
      <h2 className="flex flex-col items-start justify-between">
        <span className="text-2xl font-bold">{title}</span>
        <a className="text-xs text-quaternary-normal">{sub}</a>
      </h2>
    </div>
  );
};

export default SectionTitle;
