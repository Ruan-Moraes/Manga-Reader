type FiltersFormTypes = {
    title: string;
    isGrid?: boolean;
    children: React.ReactNode;
};

const FiltersForm = ({ title, isGrid, children }: FiltersFormTypes) => {
    return (
        <section className="flex-col gap-4">
            <form>
                <div className="flex flex-col gap-2">
                    <div>
                        <h3 className="text-lg font-bold">{title}</h3>
                    </div>
                    <div
                        {...(isGrid
                            ? { className: 'grid grid-cols-2 gap-2' }
                            : {})}
                    >
                        {children}
                    </div>
                </div>
            </form>
        </section>
    );
};

export default FiltersForm;
