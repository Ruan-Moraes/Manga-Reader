import { IoSearchSharp } from 'react-icons/io5';

const SearchInput = () => {
  return (
    <div className="w-full">
      <form role="search" className="flex gap-3">
        <input
          type="Search"
          name="search"
          aria-label="Search"
          placeholder="Pesquisar por obras, autores, gêneros..."
          className="w-full p-2 truncate transition-shadow duration-300 border-none rounded-sm outline-none appearance-none bg-tertiary placeholder-primary-default placeholder:text-sm shadow-default focus:shadow-inside hover:shadow-inside"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 transition-shadow duration-300 rounded-sm bg-tertiary shadow-default focus:shadow-inside hover:shadow-inside"
          >
            <IoSearchSharp size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchInput;
