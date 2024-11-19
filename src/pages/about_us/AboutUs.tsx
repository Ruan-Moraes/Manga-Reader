import Header from '../../layouts/Header';
import Footer from '../../layouts/Footer';
import Main from '../../layouts/Main';

import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <>
      <Header disabledSearch={true} disabledBreadcrumb={true} />
      <Main>
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold">Sobre nós</h2>
          </div>
          <div className="flex flex-col gap-2 text-xs text-justify">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
              facilisi. Nullam nec purus non dolor fermentum ultricies. Sed
              sagittis, justo nec malesuada fermentum, nulla purus malesuada
              justo, vel vehicula nunc justo nec dolor. Nulla facilisi. Nullam
              nec purus non dolor fermentum ultricies. Sed sagittis, justo
              malesuada fermentum, nulla purus malesuada justo, vel vehicula
              nunc justo nec dolor. Nulla facilisi. Nullam nec purus non dolor
              fermentum ultricies.
            </p>
            <p>
              Lorem ipsum dolor, sit amet consectetur adipisicing elit.
              Exercitationem earum optio libero error distinctio laudantium
              officiis quaerat praesentium harum! Temporibus asperiores quidem
              dolores minus sapiente ut libero vel at hic!
            </p>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Perspiciatis eius atque enim ipsa molestias fuga optio ipsam,
              laboriosam adipisci recusandae saepe qui perferendis alias magnam
              ea quis consequuntur quae necessitatibus?
            </p>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae
              cum corporis et eos vero accusamus commodi quisquam atque.
              Excepturi aliquid iusto laborum ipsam sit nulla porro corporis
              sapiente, numquam nemo!
            </p>
            <p>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit.
              Cupiditate unde quas dolor doloribus, natus ad debitis deleniti a
              voluptas sed numquam blanditiis, earum facilis, non in adipisci
              dolorem vero voluptate. Lorem ipsum dolor sit amet consectetur,
              adipisicing elit. Molestiae adipisci, quos voluptatibus labore rem
              alias distinctio inventore iusto quam. Nemo fugit, impedit eaque
              atque earum repellendus harum quis minus quae.
            </p>
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
                <Link to="/dmca">Política de Direitos Autorais (DMCA)</Link>
                <Link to="/terms-of-use">
                  Termos de uso e Política de Privacidade
                </Link>
              </nav>
            </div>
          </div>
        </section>
      </Main>
      <Footer disabledLinks={true} />
    </>
  );
};

export default AboutUs;
