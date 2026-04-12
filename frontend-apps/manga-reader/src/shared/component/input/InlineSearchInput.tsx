type InlineSearchInputProps = {
    placeholder: string;
};

// TODO: Terminar a implementação do componente.
const InlineSearchInput = ({ placeholder }: InlineSearchInputProps) => {
    return (
        <div>
            <form>
                <input
                    type="search"
                    placeholder={placeholder}
                    className="w-full p-2 bg-tertiary rounded-xs outline-none focus:border-quaternary-opacity-50 border border-transparent transition-colors duration-300 appearance-none"
                />
            </form>
        </div>
    );
};

export default InlineSearchInput;
