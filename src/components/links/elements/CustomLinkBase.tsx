import { useLocation, Link } from 'react-router-dom';

import clsx from 'clsx';

type CustomLinkBaseProps = {
  href: string;
  className?: string;
  enabledColorWhenActive?: boolean;
  text: string;
};

const CustomLinkBase = ({
  href,
  className,
  enabledColorWhenActive,
  text,
}: CustomLinkBaseProps) => {
  const isExternalLink = href.includes('http');

  const isActive = useLocation().pathname === `/Manga-Reader${href}`;

  return (
    <Link
      className={clsx(
        `font-bold transition-text-shadow duration-300  hover:text-shadow-highlight ${className}`,
        {
          'text-quaternary-default': enabledColorWhenActive && isActive,
        }
      )}
      to={isExternalLink ? href : '/Manga-Reader' + href}
    >
      {text}
    </Link>
  );
};

export default CustomLinkBase;
