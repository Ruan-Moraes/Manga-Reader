import { useLocation, Link } from 'react-router-dom';

import clsx from 'clsx';

interface ICustomLinkBase {
  href: string;
  text: string;
  className?: string;
  otherStyles?: React.CSSProperties;
  enabledColorWhenActive?: boolean;
}

const CustomLinkBase = ({
  href,
  text,
  className,
  otherStyles,
  enabledColorWhenActive,
}: ICustomLinkBase) => {
  const location = useLocation();

  const path = `/Manga-Reader${href}`;
  const isActive = location.pathname === path;

  return (
    <Link
      to={'/Manga-Reader' + href}
      style={otherStyles || {}}
      className={clsx(`font-bold duration-500 ${className}`, {
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
