import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

const PublishWork = () => {
  return (
    <>
      <Header disabledSearch={true} disabledBreadcrumb={true} />
      <Main>
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 text-xs text-justify">
            <h2 className="text-lg font-bold">
              Como faço para publicar meu trabalho?
            </h2>
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
                natus dicta doloremque velit
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <h2 className="text-lg font-bold">
                Entre em contato com a nossa equipe
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
              <div className="text-xs font-bold text-right underline text-shadow-highlight">
                <ul>
                  <li>
                    <a href="#">Nosso Discord</a>
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

export default PublishWork;
