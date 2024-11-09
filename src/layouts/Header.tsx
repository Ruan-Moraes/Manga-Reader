import { useLocation, Link } from 'react-router-dom';

import BreadCrumbContainer from '../components/breadcrumb/BreadCrumbContainer.tsx';
import SearchInput from '../components/inputs/SearchInput.tsx';

interface IHeader {
  disabledSearch?: boolean;
  disabledBreadcrumb?: boolean;
}

const Header = ({ disabledSearch, disabledBreadcrumb }: IHeader) => {
  const location = useLocation();
  console.log(location);

  return (
    <header className="flex flex-col bg-secondary">
      <div className="p-2 border-b-2 border-b-tertiary">
        <ul className="flex items-center justify-end gap-3">
          <li>
            <Link
              to="/sign-up"
              className={`font-bold transition ease-in hover:text-shadow-highlight ${
                location.pathname === '/sign-up'
                  ? 'text-quaternary-default'
                  : ''
              }`}
            >
              Sing Up
            </Link>
          </li>
          <span className="font-bold">|</span>
          <li>
            <Link
              to="/login"
              className={`font-bold transition ease-in hover:text-shadow-highlight ${
                location.pathname === '/login' ? 'text-quaternary-default' : ''
              }`}
            >
              Login
            </Link>
          </li>
        </ul>
      </div>
      <nav
        className={`flex flex-col items-center justify-center gap-2 p-3 border-b-2 bg-primary-default border-b-tertiary ${
          !disabledSearch && !disabledBreadcrumb ? 'pb-4' : 'pb-3'
        }`}
      >
        <div>
          <h1>
            <Link
              to="/"
              className="text-2xl italic font-bold transition-colors ease-in hover:text-quaternary-normal text-tertiary-normal"
            >
              Manga Reader
            </Link>
          </h1>
        </div>
        {!disabledSearch && (
          <div className="w-full">
            <SearchInput />
          </div>
        )}
      </nav>
      {!disabledBreadcrumb && (
        <nav>
          <BreadCrumbContainer />
        </nav>
      )}
    </header>
  );
};

export default Header;
