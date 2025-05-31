import React from 'react';
import {Link, useLocation} from 'react-router-dom';

import clsx from 'clsx';

type CustomLinkBaseTypes = {
    link?: string;
    className?: string;
    enabledColorWhenActive?: boolean;
    inlineStyle?: React.CSSProperties;
    children?: React.ReactNode;
    text?: string;
};

const CustomLink = React.forwardRef<HTMLAnchorElement, CustomLinkBaseTypes>(
    (
        {
            link = '/',
            className,
            enabledColorWhenActive,
            inlineStyle,
            children,
            text,
        }: CustomLinkBaseTypes,
        ref
    ) => {
        const isExternalLink = link.includes('http');
        const isActive = useLocation().pathname === `/Manga-Reader${link}`;

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
                to={isExternalLink ? link : '/Manga-Reader' + link}
            >
                {children || text}
            </Link>
        );
    }
);

export default CustomLink;
