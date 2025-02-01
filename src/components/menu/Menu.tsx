import { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { MdMenu } from 'react-icons/md';

import { clsx } from 'clsx';

import CustomLink from '../links/elements/CustomLink';
import SearchInput from '../inputs/SearchInput';
import Blur from '../blur/Blur';
import MenuLinkBlock from '../links/sections/MenuLinkBlock';

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
            'fixed top-0 left-0 right-0 z-30': isSticky,
          }
        )}
        ref={menuRef}
      >
        <div className="flex flex-col">
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
                <CustomLink text="Manga Reader" />
              </h2>
            </div>
            <div>
              <MdMenu
                aria-controls="menu-links"
                aria-expanded={isMenuOpen}
                onClick={toggleMenu}
                className="text-4xl cursor-pointer"
              />
            </div>
          </div>
        </div>
        <div className="absolute">
          <div
            className={clsx(
              'flex flex-col gap-4 w-4/6 fixed top-0 bottom-0 right-0 bg-primary-default border-l-2 border-l-tertiary z-30 transform transition-transform duration-300',
              {
                'translate-x-0': isMenuOpen,
                'translate-x-full': !isMenuOpen,
              }
            )}
            id="menu-links"
          >
            <div className="flex flex-col items-center justify-center gap-2 p-4 border-b-2 border-b-tertiary">
              <h2 className="text-2xl italic font-bold mobile-sm:text-xl mobile-md:text-2xl">
                <CustomLink text="Manga Reader" />
              </h2>
              <SearchInput />
            </div>
            <MenuLinkBlock />
          </div>
          <Blur isOpen={isMenuOpen} onChange={setIsMenuOpen} />
        </div>
      </nav>
    </>
  );
};

export default Menu;
