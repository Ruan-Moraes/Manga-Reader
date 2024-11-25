import { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { clsx } from 'clsx';

import { MdMenu } from 'react-icons/md';
import { GrDocumentConfig } from 'react-icons/gr';

import CustomLinkBase from '../links/elements/CustomLinkBase';
import SearchInput from '../inputs/SearchInput';
import Blur from '../blur/Blur';
import CustomLinkWithBox from '../links/elements/CustomLinkWithBox';

interface IMenu {
  disabledBreadcrumb?: boolean;
}

const Menu: React.FC<IMenu> = ({ disabledBreadcrumb }) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSticky, setIsSticky] = useState<boolean>(false);
  const [menuHeight, setMenuHeight] = useState<number>(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const originalOffset = useRef<number>(0);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prevOpen) => {
      const newOpenState = !prevOpen;

      document.body.style.overflow = newOpenState ? 'hidden' : 'auto';

      return newOpenState;
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (menuRef.current) {
      const currentScroll = window.scrollY;

      setIsSticky(currentScroll > originalOffset.current);
    }
  }, []);

  useLayoutEffect(() => {
    if (menuRef.current) {
      originalOffset.current = menuRef.current.offsetTop;
      setMenuHeight(menuRef.current.offsetHeight / 16);
    }

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <>
      {isSticky && <div style={{ height: `${menuHeight}rem` }} />}
      <nav
        ref={menuRef}
        className={clsx(
          'px-3 py-2 border-b-2 border-b-tertiary transition duration-500',
          {
            'fixed top-0 left-0 right-0 z-10': isSticky,
            'bg-primary-default': !disabledBreadcrumb,
            'bg-secondary': disabledBreadcrumb,
          }
        )}
      >
        <div className="flex items-center justify-between">
          <div
            className={clsx(
              'transition duration-500 text-xl font-bold text-center',
              {
                'opacity-100': isSticky,
                'opacity-0': !isSticky,
              }
            )}
          >
            <h2>
              <CustomLinkBase href="/" text="Manga Reader" />
            </h2>
          </div>
          <div>
            <MdMenu
              className="text-4xl cursor-pointer"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-controls="menu-links"
            />
          </div>
        </div>
        <div className="absolute">
          <div
            id="menu-links"
            className={clsx(
              'flex flex-col gap-4 w-4/6 fixed top-0 bottom-0 left-0 right-0 bg-primary-default border-r-2 border-r-tertiary z-20 transform transition-transform duration-500',
              {
                'translate-x-0': isMenuOpen,
                '-translate-x-full': !isMenuOpen,
              }
            )}
          >
            <div className="flex flex-col items-center justify-center gap-2 p-4 border-b-2 border-b-tertiary">
              <h1 className="text-2xl font-bold">Manga Reader</h1>
              <SearchInput />
            </div>
            <div className="flex flex-col h-full gap-6 px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                <CustomLinkWithBox href="/" text="Categorias" />
                <CustomLinkWithBox href="/" text="Nacional" />
                <CustomLinkWithBox href="/categories" text="Mangas" />
                <CustomLinkWithBox href="/about" text="Manwhas" />
                <CustomLinkWithBox href="/about" text="Manhuas" />
                <CustomLinkWithBox href="/about" text="Novels" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <CustomLinkWithBox href="/about" text="Notícias" />
                <CustomLinkWithBox href="/about" text="Eventos" />
                <CustomLinkWithBox
                  href="/about"
                  text="Grupos"
                  otherStyles={{ gridColumn: '1/3' }}
                />
              </div>
              <div className="mt-auto ml-auto">
                <button className="p-3 border-2 rounded-sm border-tertiary bg-secondary">
                  <GrDocumentConfig className="inline-block text-2xl" />
                </button>
              </div>
            </div>
          </div>
          <Blur open={isMenuOpen} setOpen={setIsMenuOpen} />
        </div>
      </nav>
    </>
  );
};

export default Menu;
