const SearchInput = () => {
  return (
    <div className="w-full">
      <form role="search">
        <input
          type="Search"
          name="search"
          aria-label="Search"
          placeholder="Pesquisar por obras, autores, gêneros..."
          className="w-full p-2 truncate transition-shadow duration-500 border-none rounded-sm outline-none appearance-none bg-tertiary placeholder-primary-default placeholder:text-sm shadow-default focus:shadow-inside hover:shadow-inside"
        />
      </form>
    </div>
  );
};

export default SearchInput;
