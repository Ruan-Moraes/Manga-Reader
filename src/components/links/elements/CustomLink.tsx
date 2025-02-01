import React from 'react';
import { useLocation, Link } from 'react-router-dom';

import clsx from 'clsx';

type CustomLinkBaseTypes = {
  href?: string;
  className?: string;
  enabledColorWhenActive?: boolean;
  inlineStyle?: React.CSSProperties;
  children?: React.ReactNode;
  text?: string;
};

const CustomLink = React.forwardRef<HTMLAnchorElement, CustomLinkBaseTypes>(
  (
    {
      href = '/',
      className,
      enabledColorWhenActive,
      inlineStyle,
      children,
      text,
    }: CustomLinkBaseTypes,
    ref
  ) => {
    const isExternalLink = href.includes('http');
    const isActive = useLocation().pathname === `/Manga-Reader${href}`;

    return (
      <Link
        ref={ref}
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
  }
);

export default CustomLink;
