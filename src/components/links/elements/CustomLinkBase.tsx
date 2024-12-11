import { useLocation, Link } from 'react-router-dom';

import clsx from 'clsx';

type CustomLinkBaseProps = {
  href: string;
  otherStyles?: React.CSSProperties;
  enabledColorWhenActive?: boolean;
  className?: string;
  text: string;
};

const CustomLinkBase = ({
  href,
  otherStyles,
  enabledColorWhenActive,
  className,
  text,
}: CustomLinkBaseProps) => {
  const isExternalLink = href.includes('http');

  const location = useLocation();

  const path = `/Manga-Reader${href}`;
  const isActive = location.pathname === path;

  return (
    <Link
      to={isExternalLink ? href : '/Manga-Reader' + href}
      style={otherStyles || {}}
      className={clsx(`font-bold duration-300 ${className}`, {
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
