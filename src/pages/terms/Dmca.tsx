import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import { Link } from 'react-router-dom';

const Dmca = () => {
  return (
    <>
      <Header disabledBreadcrumb={true} disabledSearch={true} />
      <Main>
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold">
              Política de Direitos Autorais (DMCA)
            </h2>
            <p className="text-xs">Última atualização: XX de XXXXXX de XXXX</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-xs text-justify">
              <div>
                <h3 className="text-base font-semibold">
                  1. Politica de Direitos Autorais
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  facilisi. Nullam nec purus non dolor fermentum ultricies. Sed
                  sagittis, justo nec
                </p>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam
                  nesciunt dolorem suscipit deserunt, reiciendis cum esse
                  cupiditate mollitia fugit eligendi. Laudantium sequi similique
                  natus dicta doloremque velit earum, nihil exercitationem.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs text-justify">
              <div>
                <h3 className="text-base font-semibold">
                  2. Coleta de informações pessoais
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  facilisi. Nullam nec purus non dolor fermentum ultricies. Sed
                  sagittis, justo nec
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs text-justify">
              <div>
                <h3 className="text-base font-semibold">
                  3. Uso de informações pessoais
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  facilisi. Nullam nec purus non dolor fermentum ultricies. Sed
                  sagittis, justo nec
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs text-justify">
              <div>
                <h3 className="text-base font-semibold">
                  4. Compartilhamento de informações pessoais
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  facilisi. Nullam nec purus non dolor fermentum ultricies. Sed
                  sagittis, justo nec
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <h2 className="text-lg font-bold">
                Veja outros links importantes
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-xs text-justify">
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus
                  error quae suscipit mollitia deserunt alias ipsam facilis modi
                  adipisci vel quis ipsum obcaecati, ut, nam accusantium magni
                  laudantium nulla. Obcaecati.
                </p>
              </div>
              <nav className="flex flex-col text-xs font-bold text-right underline text-shadow-highlight">
                <Link to="/Manga-Reader/terms-of-use">
                  Termos de uso e Política de Privacidade
                </Link>
                <Link to="/Manga-Reader/about-us">Quem somos?</Link>
              </nav>
            </div>
          </div>
        </section>
      </Main>
      <Footer disabledLinks={true} />
    </>
  );
};

export default Dmca;
