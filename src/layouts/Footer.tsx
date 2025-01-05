import { useMemo } from 'react';
import LinksSection from '../components/links/sections/FooterLinksSection';

type FooterProps = {
  disabledLinks?: boolean;
};

const Footer = ({ disabledLinks }: FooterProps) => {
  const getYear = useMemo(() => {
    return new Date().getFullYear();
  }, []);

  return (
    <footer className="mt-auto bg-secondary">
      {!disabledLinks && (
        <div className="grid items-center grid-cols-8 gap-4 p-4 border-t-2 border-t-tertiary">
          <LinksSection
            title="Links úteis"
            className="col-span-4"
            links={[
              { href: '/', text: 'Home' },
              { href: '/categories', text: 'Categorias' },
              { href: '/news', text: 'Notícias' },
              { href: '/events', text: 'Eventos' },
              { href: '/groups', text: 'Grupos' },
            ]}
          />
          <LinksSection
            className="col-span-4"
            title="Redes sociais"
            links={[
              { href: '#', text: 'Discord' },
              { href: '#', text: 'X (Twitter)' },
              { href: '#', text: 'Facebook' },
              { href: '#', text: 'Instagram' },
            ]}
          />
          <LinksSection
            className="col-span-6 col-start-2 "
            title="Outros links"
            links={[
              {
                href: '/i-want-to-publish-work',
                text: 'Quero publicar obra',
              },
              { href: 'https://ko-fi.com/', text: 'Doe para o projeto' },
              { href: '/about-us', text: 'Quem somos' },
              { href: '/dmca', text: 'DMCA' },
              { href: '/terms-of-use', text: 'Termos de uso' },
            ]}
          />
        </div>
      )}
      <div className="p-2 mobile-md:text-xs mobile-sm:text-[0.6125rem] text-center border-t-2 bg-primary-default border-t-tertiary text-shadow-default">
        <p>&copy; {`${getYear}`} Manga Reader. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
