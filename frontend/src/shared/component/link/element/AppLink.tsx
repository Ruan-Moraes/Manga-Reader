import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import clsx from 'clsx';

type CustomLinkBaseTypes = {
    link?: string;
    className?: string;
    enabledColorWhenActive?: boolean;
    inlineStyle?: React.CSSProperties;
    children?: React.ReactNode;
    text?: string;
};

const AppLink = React.forwardRef<HTMLAnchorElement, CustomLinkBaseTypes>(
    (
        {
            link = '/',
            className,
            enabledColorWhenActive,
            inlineStyle,
            children,
            text,
        }: CustomLinkBaseTypes,
        ref,
    ) => {
        if (text && children) {
            throw new Error(
                'O componente AppLink não pode receber ambos os props "text" e "children". Por favor, escolha um dos dois para evitar conflitos de renderização.',
            );
        }

        const isExternalLink = link.includes('http');
        const isActive = useLocation().pathname === `/Manga-Reader${link}`;

        return (
            <Link
                ref={ref}
                className={clsx(
                    `font-bold transition-text-shadow duration-300 hover:text-shadow-highlight ${className}`,
                    {
                        'text-quaternary-default':
                            enabledColorWhenActive && isActive,
                    },
                )}
                style={inlineStyle}
                to={isExternalLink ? link : '/Manga-Reader' + link}
            >
                {children ?? text}
            </Link>
        );
    },
);

export default AppLink;
