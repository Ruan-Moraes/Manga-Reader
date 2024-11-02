const Search_Input = () => {
  return (
    <form role="search">
      <input
        type="Search"
        aria-label="Search"
        placeholder="Pesquisar Manga"
        className="w-full p-2 transition-all ease-in border-none rounded-sm outline-none appearance-none bg-tertiary placeholder-primary-default placeholder:text-sm shadow-default focus:shadow-inside hover:shadow-inside"
      />
    </form>
  );
};

export default Search_Input;
