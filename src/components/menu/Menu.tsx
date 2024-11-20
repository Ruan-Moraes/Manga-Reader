import { useState } from 'react';
import { MdMenu } from 'react-icons/md';
import { Link } from 'react-router-dom';
import SearchInput from '../inputs/SearchInput';

interface IMenu {
  disabledBreadcrumb?: boolean;
}

const Menu = ({ disabledBreadcrumb }: IMenu) => {
  const [open, setOpen] = useState<boolean>(false);

  const handleClick = () => {
    setOpen(!open);

    if (open) {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }
  };

  const handleBlur = () => {
    setOpen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <nav
      className={`flex flex-row-reverse p-2 border-b-2 border-b-tertiary ${
        !disabledBreadcrumb ? 'bg-primary-default' : 'bg-secondary'
      }`}
    >
      <div>
        <MdMenu
          className="text-4xl cursor-pointer"
          onClick={handleClick}
          aria-expanded={open}
          aria-controls="menu-links"
        />
      </div>
      <div
        id="menu-links"
        className={`absolute left-0 top-0 h-screen bg-primary-default border-r-2 border-r-tertiary z-20 w-4/6 transition-all transform flex flex-col gap-4 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          transitionDuration: '300ms',
        }}
      >
        <div className="flex flex-col items-center justify-center gap-2 p-4 pb-4 border-b-2 border-b-tertiary">
          <div>
            <h2 className="text-2xl italic font-bold text-center">
              Manga Reader
            </h2>
          </div>
          <SearchInput />
        </div>
        <div className="flex flex-col gap-6 px-4">
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/"
              onClick={handleClick}
              className="px-2 py-1 font-bold text-center border-2 rounded-sm bg-secondary text-shadow-highlight border-tertiary"
            >
              Categorias
            </Link>
            <Link
              to="/"
              onClick={handleClick}
              className="px-2 py-1 font-bold text-center border-2 rounded-sm bg-secondary text-shadow-highlight border-tertiary"
            >
              Nacional
            </Link>
            <Link
              to="/categories"
              onClick={handleClick}
              className="px-2 py-1 font-bold text-center border-2 rounded-sm bg-secondary text-shadow-highlight border-tertiary"
            >
              Mangas
            </Link>
            <Link
              to="/about"
              onClick={handleClick}
              className="px-2 py-1 font-bold text-center border-2 rounded-sm bg-secondary text-shadow-highlight border-tertiary"
            >
              Manwhas
            </Link>
            <Link
              to="/about"
              onClick={handleClick}
              className="px-2 py-1 font-bold text-center border-2 rounded-sm bg-secondary text-shadow-highlight border-tertiary"
            >
              Manhuas
            </Link>
            <Link
              to="/about"
              onClick={handleClick}
              className="px-2 py-1 font-bold text-center border-2 rounded-sm bg-secondary text-shadow-highlight border-tertiary"
            >
              Novels
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/"
              onClick={handleClick}
              className="px-2 py-1 font-bold text-center border-2 rounded-sm bg-secondary text-shadow-highlight border-tertiary"
            >
              Notícias
            </Link>
            <Link
              to="/about"
              onClick={handleClick}
              className="px-2 py-1 font-bold text-center border-2 rounded-sm bg-secondary text-shadow-highlight border-tertiary"
            >
              Eventos
            </Link>
            <Link
              to="/about"
              onClick={handleClick}
              className="col-span-2 px-2 py-1 font-bold text-center border-2 rounded-sm bg-secondary text-shadow-highlight border-tertiary"
            >
              Grupos
            </Link>
          </div>
        </div>
      </div>
      <div
        className={`absolute top-0 left-0 w-screen h-screen backdrop-blur-sm z-10 transition-all ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          transitionDuration: '300ms',
        }}
        onClick={handleBlur}
      ></div>
    </nav>
  );
};

export default Menu;
