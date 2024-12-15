import { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { MdMenu } from 'react-icons/md';
import { GrDocumentConfig } from 'react-icons/gr';

import { clsx } from 'clsx';

import CustomLinkBase from '../links/elements/CustomLinkBase';
import SearchInput from '../inputs/SearchInput';
import Blur from '../blur/Blur';
import CustomLinkWithBox from '../links/elements/CustomLinkWithBox';

import { clearCache } from '../../main';

const Menu = () => {
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
        className={clsx(
          'px-3 py-2 bg-secondary border-b-2 border-b-tertiary transition duration-300',
          {
            'fixed top-0 left-0 right-0 z-10': isSticky,
          }
        )}
        ref={menuRef}
      >
        <div className="flex items-center justify-between">
          <div
            className={clsx(
              'transition duration-300 text-xl font-bold text-center',
              {
                'opacity-100': isSticky,
                'opacity-0': !isSticky,
              }
            )}
          >
            <h2
              className={clsx('italic', {
                'pointer-events-none': !isSticky,
              })}
            >
              <CustomLinkBase href="" text="Manga Reader" />
            </h2>
          </div>
          <div>
            <MdMenu
              aria-controls="menu-links"
              aria-expanded={isMenuOpen}
              className="text-4xl cursor-pointer"
              onClick={toggleMenu}
            />
          </div>
        </div>
        <div className="absolute">
          <div
            className={clsx(
              'flex flex-col gap-4 w-4/6 fixed top-0 bottom-0 left-0 right-0 bg-primary-default border-r-2 border-r-tertiary z-20 transform transition-transform duration-300',
              {
                'translate-x-0': isMenuOpen,
                '-translate-x-full': !isMenuOpen,
              }
            )}
            id="menu-links"
          >
            <div className="flex flex-col items-center justify-center gap-2 p-4 border-b-2 border-b-tertiary">
              <h1 className="text-2xl italic font-bold mobile-sm:text-xl mobile-md:text-2xl">
                <CustomLinkBase href="" text="Manga Reader" />
              </h1>
              <SearchInput />
            </div>
            <div className="flex flex-col h-full gap-6 px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                <CustomLinkWithBox href="/categories" text="Categorias" />
                <CustomLinkWithBox
                  href="/categories?tags=nacionais"
                  text="Nacional"
                />
                <CustomLinkWithBox
                  href="/categories?tags=mangas"
                  text="Mangas"
                />
                <CustomLinkWithBox
                  href="/categories?tags=manwhas"
                  text="Manhwas"
                />
                <CustomLinkWithBox
                  href="/categories?tags=manhuas"
                  text="Manhuas"
                />
                <CustomLinkWithBox
                  href="/categories?tags=Light%20Novels"
                  text="Novels"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <CustomLinkWithBox href="/news" text="Notícias" />
                <CustomLinkWithBox href="/events" text="Eventos" />
                <CustomLinkWithBox
                  className="col-span-2"
                  href="/groups"
                  text="Grupos"
                />
              </div>
              <div className="flex w-full gap-4 mt-auto ml-auto">
                <button
                  className="flex items-center justify-center gap-2 p-3 font-bold text-center border-2 rounded-sm mobile-sm:text-xs mobile-md:text-base border-tertiary bg-secondary grow"
                  onClick={clearCache}
                >
                  Limpar cache
                </button>
                <button className="p-3 border-2 rounded-sm border-tertiary bg-secondary">
                  <GrDocumentConfig className="inline-block text-2xl" />
                </button>
              </div>
            </div>
          </div>
          <Blur isOpen={isMenuOpen} onChange={setIsMenuOpen} />
        </div>
      </nav>
    </>
  );
};

export default Menu;
