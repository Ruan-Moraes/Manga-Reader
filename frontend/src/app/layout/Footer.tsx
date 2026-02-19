import { useMemo } from 'react';

import LinksSection from '@shared/component/link/section/FooterLinksSection';

type FooterTypes = {
    styles?: React.CSSProperties;
    showLinks?: boolean;
};

const Footer = ({ styles, showLinks }: FooterTypes) => {
    const getYear = useMemo(() => {
        return new Date().getFullYear();
    }, []);

    return (
        <footer className="mt-auto bg-secondary" style={styles}>
            {!showLinks && (
                <div className="grid items-center grid-cols-8 gap-4 p-4 border-t-2 border-t-tertiary">
                    <LinksSection
                        title="Links úteis"
                        className="col-span-4"
                        links={[
                            { url: '/', text: 'Home' },
                            { url: '/categories', text: 'Categorias' },
                            { url: '/news', text: 'Notícias' },
                            { url: '/events', text: 'Eventos' },
                            { url: '/forum', text: 'Fórum' },
                            { url: '/groups', text: 'Grupos' },
                        ]}
                    />
                    <LinksSection
                        className="col-span-4"
                        title="Redes sociais"
                        links={[
                            { url: '#', text: 'Discord' },
                            { url: '#', text: 'X (Twitter)' },
                            { url: '#', text: 'Facebook' },
                            { url: '#', text: 'Instagram' },
                        ]}
                    />
                    <LinksSection
                        className="col-span-6 col-start-2"
                        title="Outros links"
                        links={[
                            {
                                url: '/i-want-to-publish-work',
                                text: 'Quero publicar obra',
                            },
                            {
                                url: 'https://ko-fi.com/',
                                text: 'Doe para o projeto',
                            },
                            { url: '/about-us', text: 'Quem somos' },
                            { url: '/dmca', text: 'DMCA' },
                            { url: '/terms-of-use', text: 'Termos de uso' },
                        ]}
                    />
                </div>
            )}
            <div className="p-2 text-xs text-center border-t-2 bg-primary-default border-t-tertiary text-shadow-default">
                <p>
                    &copy; {`${getYear}`} Manga Reader. Todos os direitos
                    reservados.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
