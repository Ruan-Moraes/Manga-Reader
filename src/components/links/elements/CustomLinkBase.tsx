import { useLocation, Link } from 'react-router-dom';

import clsx from 'clsx';

type CustomLinkBaseProps = {
  href: string;
  className?: string;
  inlineStyle?: React.CSSProperties;
  enabledColorWhenActive?: boolean;
  text?: string;
  children?: React.ReactNode;
};

const CustomLinkBase = ({
  href,
  className,
  inlineStyle,
  enabledColorWhenActive,
  text,
  children,
}: CustomLinkBaseProps) => {
  const isExternalLink = href.includes('http');
  const isActive = useLocation().pathname === `/Manga-Reader${href}`;

  return (
    <Link
      className={clsx(
        `font-bold transition-text-shadow duration-300 hover:text-shadow-highlight ${className}`,
        {
          'text-quaternary-default': enabledColorWhenActive && isActive,
        }
      )}
      style={inlineStyle}
      to={isExternalLink ? href : '/Manga-Reader' + href}
    >
      {children || text}
    </Link>
  );
};

export default CustomLinkBase;
