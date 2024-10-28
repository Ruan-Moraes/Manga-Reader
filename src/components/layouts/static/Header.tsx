import BreadCrump from '../../common/breadcrumb/BreadCrumb.tsx';
import SearchInput from '../../common/others/SearchInput.tsx';

const Header = () => {
  return (
    <header className="flex flex-col bg-secondary ">
      <div className="p-3">
        <ul className="flex items-center justify-end gap-3">
          <li>
            <a
              href="#"
              className="font-bold transition-colors ease-in hover:text-quaternary-normal"
            >
              Sing Up
            </a>
          </li>
          <span className="font-bold">|</span>
          <li>
            <a
              href="#"
              className="font-bold transition-colors ease-in hover:text-quaternary-normal"
            >
              Login
            </a>
          </li>
        </ul>
      </div>
      <nav className="flex flex-col items-center justify-center gap-2 p-3 pb-4 bg-primary-default border-y-2 border-y-tertiary">
        <div>
          <a
            href="#"
            className="text-xl italic font-bold transition-colors ease-in hover:text-quaternary-normal text-tertiary-normal"
          >
            Manga Reader
          </a>
        </div>
        <div className="w-full">
          <SearchInput />
        </div>
      </nav>
      <nav>
        <BreadCrump />
      </nav>
    </header>
  );
};

export default Header;
