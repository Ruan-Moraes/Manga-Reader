import { Link } from 'react-router-dom';

import Header from '../layouts/Header';
import Main from '../layouts/Main';
import Footer from '../layouts/Footer';

const TermsOfUse = () => {
  return (
    <>
      <Header
        disabledBreadcrumb={true}
        disabledSearch={true}
        disabledAuth={true}
      />
      <Main>
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-bold">
              Termos de uso e Políticas de privacidade
            </h2>
            <p className="text-xs">
              Última atualização: XX de XXXXXXXX de XXXX
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div>
                <h3 className="text-sm font-bold">1. Introdução</h3>
              </div>
              <div>
                <p className="ml-4 text-xs text-justify">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  facilisi. Nullam nec purus non dolor fermentum ultricies. Sed
                  sagittis, justo nec
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div>
                <h3 className="text-sm font-bold">2. Definições</h3>
              </div>
              <div className="flex flex-col gap-2">
                <p className="ml-4 text-xs text-justify">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  facilisi. Nullam nec purus non dolor fermentum ultricies. Sed
                  sagittis, justo nec
                </p>
                <p className="ml-4 text-xs text-justify">
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Odio
                  ratione facilis, sapiente architecto veniam deleniti, fuga
                  cumque nemo ipsum deserunt praesentium qui optio debitis quae!
                  Earum recusandae voluptatum tenetur libero.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div>
                <h3 className="text-sm font-bold">
                  3. Coleta e uso de informações
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                <p className="ml-4 text-xs text-justify">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  facilisi. Nullam nec purus non dolor fermentum ultricies. Sed
                  sagittis, justo nec
                </p>
                <p className="ml-4 text-xs text-justify">
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Odio
                  ratione facilis, sapiente architecto veniam deleniti, fuga
                  cumque nemo ipsum deserunt praesentium qui optio debitis quae!
                  Earum recusandae voluptatum tenetur libero.
                </p>
                <p className="ml-4 text-xs text-justify">
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Odio
                  ratione facilis, sapiente architecto veniam deleniti, fuga
                  cumque nemo ipsum deserunt praesentium qui optio debitis quae!
                  Earum recusandae voluptatum tenetur libero.
                </p>
              </div>
            </div>
            <div>
              <div>
                <h3 className="text-sm font-bold">
                  4. Compartilhamento de informações
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                <p className="ml-4 text-xs text-justify">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  facilisi. Nullam nec purus non dolor fermentum ultricies. Sed
                  sagittis, justo nec
                </p>
              </div>
            </div>
            <div>
              <div>
                <h3 className="text-sm font-bold">
                  5. Cookies e tecnologias semelhantes
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                <p className="ml-4 text-xs text-justify">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  facilisi. Nullam nec purus non dolor fermentum ultricies. Sed
                  sagittis, justo nec
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div>
              <h2 className="font-bold">
                Politíca de Direitos Autorais (DMCA) e Quem somos
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <p className="ml-4 text-xs text-justify">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  D\icta consequuntur esse rerum ducimus nobis quibusdam
                  sapiente cum. Quasi, placeat dolores. Soluta, reprehenderit
                  quidem nisi tempore blanditiis a laudantium odio magni?
                </p>
              </div>
              <div className="text-xs font-bold text-right text-shadow-highlight">
                <ul>
                  <li>
                    <Link to="/dmca">Política de Direitos Autorais (DMCA)</Link>
                  </li>
                  <li>
                    <Link to="/about-us">Quem somos</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </Main>
      <Footer disabledLinks={true} />
    </>
  );
};

export default TermsOfUse;
