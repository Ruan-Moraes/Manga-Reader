import { useLocation, Link } from 'react-router-dom';

import SearchInput from '../components/inputs/SearchInput.tsx';
import BreadCrumbContainer from '../components/breadcrumb/BreadCrumbContainer.tsx';

import Menu from '../components/menu/Menu.tsx';

interface IHeader {
  disabledAuth?: boolean;
  disabledSearch?: boolean;
  disabledMenu?: boolean;
  disabledBreadcrumb?: boolean;
}

const Header = ({
  disabledAuth,
  disabledSearch,
  disabledMenu,
  disabledBreadcrumb,
}: IHeader) => {
  const location = useLocation();

  return (
    <header className="flex flex-col bg-secondary">
      {!disabledAuth && (
        <nav className="flex items-center justify-end gap-3 p-2 border-b-2 border-b-tertiary">
          <Link
            to="/sign-up"
            className={`font-bold transition ease-in hover:text-shadow-highlight ${
              location.pathname === '/sign-up' ? 'text-quaternary-default' : ''
            }`}
          >
            Sing Up
          </Link>
          <span className="font-bold">|</span>
          <Link
            to="/login"
            className={`font-bold transition ease-in hover:text-shadow-highlight ${
              location.pathname === '/login' ? 'text-quaternary-default' : ''
            }`}
          >
            Login
          </Link>
        </nav>
      )}
      <nav
        className={`flex flex-col items-center justify-center gap-2 p-3 border-b-2 bg-primary-default border-b-tertiary ${
          !disabledSearch && !disabledBreadcrumb ? 'pb-4' : 'pb-3'
        }`}
      >
        <div>
          <h1>
            <Link
              to="/"
              className="text-3xl italic font-bold transition-colors ease-in hover:text-quaternary-normal text-tertiary-normal"
            >
              Manga Reader
            </Link>
          </h1>
        </div>
        {!disabledSearch && <SearchInput />}
      </nav>
      {!disabledMenu && <Menu disabledBreadcrumb />}
      {!disabledBreadcrumb && <BreadCrumbContainer />}
    </header>
  );
};

export default Header;
