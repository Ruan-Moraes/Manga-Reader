import CustomLinkBase from '../components/links/elements/CustomLinkBase';

import SearchInput from '../components/inputs/SearchInput';
import Menu from '../components/menu/Menu.tsx';
import BreadCrumbContainer from '../components/breadcrumb/BreadCrumbContainer';

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
              href="/"
              text="Manga Reader"
              otherStyles={{
                fontSize: '1.875rem',
                lineHeight: '2.25rem',
                fontStyle: 'italic',
              }}
            />
          </h1>
        </div>
        {!disabledSearch && <SearchInput />}
      </nav>
      {!disabledMenu && <Menu disabledBreadcrumb={disabledBreadcrumb} />}
      {!disabledBreadcrumb && <BreadCrumbContainer />}
    </header>
  );
};

export default Header;
