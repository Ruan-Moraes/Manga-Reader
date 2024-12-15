import { IoSearchSharp } from 'react-icons/io5';

const SearchInput = () => {
  return (
    <div className="w-full">
      <form className="flex gap-3" role="search">
        <input
          aria-label="Search"
          className="w-full p-2 truncate transition-shadow duration-300 border-none rounded-sm outline-none appearance-none bg-tertiary placeholder-primary-default placeholder:text-sm shadow-default focus:shadow-inside hover:shadow-inside"
          name="search"
          placeholder="Pesquisar por obras, autores, gêneros..."
          type="Search"
        />
        <div className="flex justify-end">
          <button
            className="px-4 py-2 transition-shadow duration-300 rounded-sm bg-tertiary shadow-default focus:shadow-inside hover:shadow-inside"
            type="submit"
          >
            <IoSearchSharp size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchInput;
