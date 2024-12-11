type FiltersFormProps = {
  isGrid?: boolean;
  title: string;
  children: React.ReactNode;
};

const FiltersForm = ({ isGrid, title, children }: FiltersFormProps) => {
  return (
    <>
      <section className="flex-col gap-4 before:flex">
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <div {...(isGrid ? { className: 'grid grid-cols-2 gap-4' } : {})}>
            {children}
          </div>
        </div>
      </section>
    </>
  );
};

export default FiltersForm;
//
