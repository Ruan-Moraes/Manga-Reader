// src/components/Footer/Footer.tsx
import LinksSection from '../components/links/sections/FooterLinksSection';

type FooterProps = {
  disabledLinks?: boolean;
};

const Footer = ({ disabledLinks }: FooterProps) => {
  return (
    <footer className="mt-auto bg-secondary">
      {!disabledLinks && (
        <div className="grid items-center grid-cols-8 gap-4 p-4 border-t-2 border-t-tertiary">
          <LinksSection
            title="Links úteis"
            links={[
              { href: '/', text: 'Home' },
              { href: '/categories', text: 'Categorias' },
              { href: '/news', text: 'Notícias' },
              { href: '/events', text: 'Eventos' },
              { href: '/groups', text: 'Grupos' },
            ]}
            classNames="col-span-4"
          />
          <LinksSection
            title="Redes sociais"
            links={[
              { href: '#', text: 'Discord' },
              { href: '#', text: 'X (Twitter)' },
              { href: '#', text: 'Facebook' },
              { href: '#', text: 'Instagram' },
            ]}
            classNames="col-span-4"
          />
          <LinksSection
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
            classNames=" col-start-2 col-span-6"
          />
        </div>
      )}
      <div className="p-2 text-xs text-center border-t-2 bg-primary-default border-t-tertiary text-shadow-default">
        <p>&copy; 2024 Manga Reader. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
