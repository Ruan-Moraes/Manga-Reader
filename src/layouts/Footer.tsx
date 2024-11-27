// src/components/Footer/Footer.tsx
import LinksSection from '../components/links/sections/FooterLinksSection';

interface IFooter {
  disabledLinks?: boolean;
}

const Footer = ({ disabledLinks }: IFooter) => {
  return (
    <footer className="mt-auto bg-secondary">
      {!disabledLinks && (
        <div className="grid items-center grid-cols-4 gap-4 p-4 border-t-2 border-t-tertiary">
          <LinksSection
            title="Links úteis"
            links={[
              { href: '/', text: 'Home' },
              { href: '/', text: 'Categorias' },
              { href: '/', text: 'Notícias' },
              { href: '/', text: 'Eventos' },
              { href: '/', text: 'Grupos' },
            ]}
            otherStyles={{
              gridColumn: '1/3',
            }}
          />
          <LinksSection
            title="Redes sociais"
            links={[
              { href: '/', text: 'Discord' },
              { href: '/', text: 'X (Twitter)' },
              { href: '/', text: 'Facebook' },
              { href: '/', text: 'Instagram' },
            ]}
            otherStyles={{
              gridColumn: '3/-1',
            }}
          />
          <LinksSection
            title="Outros links"
            links={[
              {
                href: '/Manga-Reader/i-want-to-publish-work',
                text: 'Quero publicar obra',
              },
              { href: 'https://ko-fi.com/', text: 'Doe para o projeto' },
              { href: '/Manga-Reader/about-us', text: 'Quem somos' },
              { href: '/Manga-Reader/dmca', text: 'DMCA' },
              { href: '/Manga-Reader/terms-of-use', text: 'Termos de uso' },
            ]}
            otherStyles={{
              gridColumn: '2/4',
            }}
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
