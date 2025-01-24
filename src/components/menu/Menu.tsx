import { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { MdMenu } from 'react-icons/md';
import { GrDocumentConfig } from 'react-icons/gr';
import Select, { SelectInstance, SingleValue } from 'react-select';

import { clsx } from 'clsx';

import CustomLinkBase from '../links/elements/CustomLinkBase';
import SearchInput from '../inputs/SearchInput';
import Blur from '../blur/Blur';
import { clearCache } from '../../main';
import LinkBox from '../boxes/LinkBox';

const Menu = () => {
  const isChapterPage = useParams().chapter ? true : false;

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

  const navigate = useNavigate();

  const titleId = useParams().title;
  const chapterId = useParams().chapter;

  const selectRef =
    useRef<SelectInstance<{ value: string; label: string }>>(null);

  const handleChange = (
    newValue: SingleValue<{ value: string; label: string }>
  ) => {
    navigate(`/Manga-Reader/titles/${titleId}/${newValue?.value}`);
  };

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
          {isChapterPage && isSticky && (
            <div
              className={clsx(
                'flex items-stretch gap-4 pt-1 transition duration-300',
                {
                  'opacity-100': isSticky,
                  'opacity-0': !isSticky,
                }
              )}
            >
              <div className="grow">
                <form>
                  <Select
                    name="chapter"
                    ref={selectRef}
                    onChange={handleChange}
                    defaultValue={{
                      value: chapterId,
                      label: `Capítulo ${chapterId}`,
                    }}
                    isClearable={false}
                    isSearchable={true}
                    blurInputOnSelect={true}
                    noOptionsMessage={() => 'Carregando...'}
                    options={[
                      { value: '1', label: 'Capítulo 1' },
                      { value: '2', label: 'Capítulo 2' },
                      { value: '3', label: 'Capítulo 3' },
                      { value: '4', label: 'Capítulo 4' },
                      { value: '5', label: 'Capítulo 5' },
                      { value: '6', label: 'Capítulo 6' },
                      { value: '7', label: 'Capítulo 7' },
                      { value: '8', label: 'Capítulo 8' },
                      { value: '9', label: 'Capítulo 9' },
                      { value: '10', label: 'Capítulo 10' },
                    ]}
                    styles={{
                      control: (baseStyles, state) => ({
                        ...baseStyles,
                        padding: '0.5rem',
                        backgroundColor: '#252526',
                        borderRadius: '0.125rem',
                        border: state.isFocused
                          ? '0.0625rem solid #ddda2a'
                          : '0.0625rem solid #727273',
                        boxShadow: state.isFocused ? '0 0 0 0' : '0 0 0 0',
                        cursor: 'text',
                        transition: 'border 0.3s',
                        '&:hover': {
                          border: state.isFocused ? 0 : 0,
                        },
                      }),
                      placeholder: (baseStyles) => ({
                        ...baseStyles,
                        fontSize: '0.875rem',
                        lineHeight: '1rem',
                        color: '#FFFFFF',
                      }),
                      valueContainer: (baseStyles) => ({
                        ...baseStyles,
                        padding: '0',
                      }),
                      input: (baseStyles) => ({
                        ...baseStyles,
                        margin: '0 0 0 0.25rem',
                        padding: '0',
                        color: '#FFFFFF',
                      }),
                      singleValue: (baseStyles) => ({
                        ...baseStyles,
                        color: '#FFFFFF',
                      }),
                      multiValue: (baseStyles) => ({
                        ...baseStyles,
                        margin: '0.125rem',
                        padding: '0.25rem',
                        borderRadius: '0.125rem',
                        backgroundColor: '#161616',
                        transition: 'background-color 0.3s',
                        ':hover': {
                          backgroundColor: '#161616bf',
                        },
                      }),
                      multiValueLabel: (baseStyles) => ({
                        ...baseStyles,
                        fontSize: '0.875rem',
                        lineHeight: '1rem',
                        color: '#FFFFFF',
                      }),
                      menu: (baseStyles) => ({
                        ...baseStyles,
                        borderRadius: '0.125rem',
                        border: '0.125rem solid #727273',
                        backgroundColor: '#161616',
                      }),
                      menuList: (baseStyles) => ({
                        ...baseStyles,
                        padding: '0',
                        overflowX: 'hidden',
                      }),
                      option: (baseStyles, state) => ({
                        ...baseStyles,
                        backgroundColor: state.isSelected
                          ? '#ddda2a'
                          : '#161616',
                        color: state.isSelected ? '#161616' : '#FFFFFF',
                        ':hover': {
                          backgroundColor: '#ddda2a',
                          color: '#161616',
                        },
                      }),
                      dropdownIndicator: (baseStyles) => ({
                        ...baseStyles,
                        padding: '0.125rem',
                        margin: '0 0 0 6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                        ':hover': {
                          backgroundColor: '#ddda2a80',
                        },
                      }),
                      indicatorSeparator: (baseStyles) => ({
                        ...baseStyles,
                        margin: '0',
                        backgroundColor: '#727273',
                      }),
                    }}
                  />
                </form>
              </div>
              <div className="flex gap-2 text-sm">
                <button className="p-2 border rounded-sm bg-secondary border-tertiary">
                  Anterior
                </button>
                <button className="p-2 border rounded-sm bg-secondary border-tertiary">
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="absolute">
          <div
            className={clsx(
              'flex flex-col gap-4 w-4/6 fixed top-0 bottom-0 left-0 right-0 bg-primary-default border-r-2 border-r-tertiary z-30 transform transition-transform duration-300',
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
                <LinkBox className="col-span-2">
                  <CustomLinkBase
                    href="/categories?tags=shounen"
                    text="Shounen"
                    className="block h-full py-2 hover:text-shadow-default"
                  />
                </LinkBox>
                <LinkBox>
                  <CustomLinkBase
                    href="/categories?tags=shoujo"
                    text="Shoujo"
                    className="block h-full py-2 hover:text-shadow-default"
                  />
                </LinkBox>
                <LinkBox>
                  <CustomLinkBase
                    href="/categories?tags=seinen"
                    text="Seinen"
                    className="block h-full py-2 hover:text-shadow-default"
                  />
                </LinkBox>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <LinkBox className="col-span-2">
                  <CustomLinkBase
                    href="/categories?tags=nacionais"
                    text="Nacional"
                    className="block h-full py-2 hover:text-shadow-default"
                  />
                </LinkBox>
                <LinkBox>
                  <CustomLinkBase
                    href="/categories?tags=mangas"
                    text="Mangas"
                    className="block h-full py-2 hover:text-shadow-default"
                  />
                </LinkBox>
                <LinkBox>
                  <CustomLinkBase
                    href="/categories?tags=manwhas"
                    text="Manhwas"
                    className="block h-full py-2 hover:text-shadow-default"
                  />
                </LinkBox>
                <LinkBox>
                  <CustomLinkBase
                    href="/categories?tags=manhuas"
                    text="Manhuas"
                    className="block h-full py-2 hover:text-shadow-default"
                  />
                </LinkBox>
                <LinkBox>
                  <CustomLinkBase
                    href="/categories?tags=Light%20Novels"
                    text="Novels"
                    className="block h-full py-2 hover:text-shadow-default"
                  />
                </LinkBox>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <LinkBox className="col-span-2">
                  <CustomLinkBase
                    href="/groups"
                    text="Grupos"
                    className="block col-span-2 py-2 hover:text-shadow-default"
                  />
                </LinkBox>
                <LinkBox>
                  <CustomLinkBase
                    href="/news"
                    text="Notícias"
                    className="block h-full py-2 hover:text-shadow-default"
                  />
                </LinkBox>
                <LinkBox>
                  <CustomLinkBase
                    href="/events"
                    text="Eventos"
                    className="block h-full py-2 hover:text-shadow-default"
                  />
                </LinkBox>
              </div>
              <div className="flex w-full gap-4 mt-auto ml-auto">
                <button
                  className="flex items-center justify-center gap-2 p-3 font-bold text-center border rounded-sm mobile-sm:text-xs mobile-md:text-base border-tertiary bg-secondary grow"
                  onClick={clearCache}
                >
                  Limpar cache
                </button>
                <button className="p-3 border rounded-sm border-tertiary bg-secondary">
                  <GrDocumentConfig className="text-2xl" />
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
