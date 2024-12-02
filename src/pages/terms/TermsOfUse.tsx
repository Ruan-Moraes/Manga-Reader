import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import CustomLinkBase from '../../components/links/elements/CustomLinkBase';

const TermsOfUse = () => {
  return (
    <>
      <Header disabledBreadcrumb={true} disabledSearch={true} />
      <Main>
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold">
              Termos de uso e Políticas de privacidade
            </h2>
            <p className="text-xs">
              Última atualização: XX de XXXXXXXX de XXXX
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-xs text-justify">
              <div>
                <h3 className="text-base font-semibold">1. Introdução</h3>
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
                  5. Cookies e tecnologias semelhantes
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
              <nav className="flex flex-col items-end text-xs underline text-shadow-highlight">
                <CustomLinkBase
                  href="/dmca"
                  text="Política de Direitos Autorais (DMCA)"
                  otherStyles={{
                    width: 'fit-content',
                  }}
                />
                <CustomLinkBase
                  href="/about-us"
                  text="Quem somos?"
                  otherStyles={{
                    width: 'fit-content',
                  }}
                />
              </nav>
            </div>
          </div>
        </section>
      </Main>
      <Footer disabledLinks={true} />
    </>
  );
};

export default TermsOfUse;
