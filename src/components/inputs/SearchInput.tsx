import { IoSearchSharp } from 'react-icons/io5';

const SearchInput = () => {
  return (
    <div className="w-full">
      <form role="search">
        <div className="flex items-center h-10 px-4 transition-shadow duration-300 rounded-xs bg-tertiary shadow-default focus:shadow-inside hover:shadow-inside">
          <input
            name="search"
            type="Search"
            aria-label="Search"
            placeholder="Pesquisar por obras, autores, gêneros..."
            className="w-full truncate bg-transparent border-none outline-none appearance-none placeholder-primary-default placeholder:text-sm grow"
          />
          <div className="flex items-center justify-center">
            <div className="w-[0.0625rem] h-[1.875rem] bg-secondary"></div>
            <button type="submit" className="pl-4">
              <IoSearchSharp size={24} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchInput;
