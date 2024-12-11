import CustomLinkBase from '../components/links/elements/CustomLinkBase';

import SearchInput from '../components/inputs/SearchInput';
import Menu from '../components/menu/Menu.tsx';
import BreadCrumbContainer from '../components/breadcrumb/BreadCrumbContainer';

type HeaderProps = {
  disabledAuth?: boolean;
  disabledSearch?: boolean;
  disabledBreadcrumb?: boolean;
};

const Header = ({
  disabledAuth,
  disabledSearch,
  disabledBreadcrumb,
}: HeaderProps) => {
  return (
    <header className="flex flex-col bg-secondary">
      {!disabledAuth && (
        <nav className="flex items-center justify-end gap-3 p-2 border-b-2 border-b-tertiary">
          <CustomLinkBase
            href="/sign-up"
            text="Sing up"
            enabledColorWhenActive={true}
          />
          <span className="font-bold">|</span>
          <CustomLinkBase
            href="/login"
            text="Login"
            enabledColorWhenActive={true}
          />
        </nav>
      )}
      <nav className="flex flex-col items-center justify-center gap-2 p-4 border-b-2 bg-primary-default border-b-tertiary">
        <div>
          <h1>
            <CustomLinkBase
              href=""
              text="Manga Reader"
              className="text-2xl italic"
            />
          </h1>
        </div>
        {!disabledSearch && <SearchInput />}
      </nav>
      <Menu />
      {!disabledBreadcrumb && <BreadCrumbContainer />}
    </header>
  );
};

export default Header;
