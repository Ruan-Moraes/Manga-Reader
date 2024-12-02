import { useLocation, Link } from 'react-router-dom';

import clsx from 'clsx';

interface ICustomLinkBase {
  href: string;
  text: string;
  enabledColorWhenActive?: boolean;
  otherStyles?: React.CSSProperties;
}

const CustomLinkBase = ({
  href,
  text,
  enabledColorWhenActive,
  otherStyles,
}: ICustomLinkBase) => {
  const location = useLocation();

  const path = `/Manga-Reader${href}`;
  const isActive = location.pathname === path;

  return (
    <Link
      to={'/Manga-Reader' + href}
      style={otherStyles || {}}
      className={clsx('font-bold text-center duration-500', {
        'transition-text-shadow hover:text-shadow-highlight':
          !enabledColorWhenActive,
        'text-quaternary-default': enabledColorWhenActive && isActive,
      })}
    >
      {text}
    </Link>
  );
};

export default CustomLinkBase;
