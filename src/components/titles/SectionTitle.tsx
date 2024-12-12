type SectionTitleProps = {
  title: string;
  sub?: string;
  children?: React.ReactNode;
};

const SectionTitle = ({ title, sub, children }: SectionTitleProps) => {
  return (
    <div className={children ? 'flex flex-col gap-2' : ''}>
      <div>
        <h2 className="flex flex-col">
          <span className="text-2xl font-bold">{title}</span>
          {sub && (
            <span className="text-xs text-quaternary-default">{sub}</span>
          )}
        </h2>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default SectionTitle;
