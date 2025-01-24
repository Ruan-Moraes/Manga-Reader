import CustomLinkBase from '../components/links/elements/CustomLinkBase';

import clsx from 'clsx';

import SearchInput from '../components/inputs/SearchInput';
import Menu from '../components/menu/Menu.tsx';

type HeaderTypes = {
  disabledAuth?: boolean;
  disabledSearch?: boolean;
};

const Header = ({ disabledAuth, disabledSearch }: HeaderTypes) => {
  return (
    <header className={clsx('bg-secondary', {})}>
      {!disabledAuth && (
        <nav className="flex items-center justify-end gap-3 p-2 border-b-2 border-b-tertiary">
          <CustomLinkBase
            enabledColorWhenActive={true}
            href="/sign-up"
            text="Sing up"
          />
          <span className="font-bold">|</span>
          <CustomLinkBase
            enabledColorWhenActive={true}
            href="/login"
            text="Login"
          />
        </nav>
      )}
      <nav className="flex flex-col items-center justify-center gap-2 p-4 border-b-2 bg-primary-default border-b-tertiary">
        <div>
          <h1>
            <CustomLinkBase className="text-2xl italic" text="Manga Reader" />
          </h1>
        </div>
        {!disabledSearch && <SearchInput />}
      </nav>
      <Menu />
    </header>
  );
};

export default Header;
