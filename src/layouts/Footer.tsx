const Footer = () => {
  return (
    <footer className="bg-secondary">
      <div className="flex flex-col items-center gap-4 p-4 border-t-2 border-t-tertiary">
        <div className="flex items-center justify-center w-full gap-4">
          <div className="w-full">
            <div className="p-2 font-bold text-center border-2 rounded-sm rounded-b-none bg-primary-default border-tertiary text-shadow-default">
              <h3 className="text-shadow-highlight">Links úteis</h3>
            </div>
            <div>
              <ul className="flex flex-col px-2 text-center border-2 border-t-0 rounded-sm rounded-t-none bg-primary-default border-tertiary text-shadow-default">
                <li className="p-2 border-b-2 border-b-tertiary">
                  <a href="#">Home</a>
                </li>
                <li className="p-2 border-b-2 border-b-tertiary">
                  <a href="#">Categorias</a>
                </li>
                <li className="p-2">
                  <a href="#">Novidades</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="w-full">
            <div className="p-2 font-bold text-center border-2 rounded-sm rounded-b-none bg-primary-default border-tertiary text-shadow-default">
              <h3 className="text-shadow-highlight">Redes sociais</h3>
            </div>
            <div>
              <ul className="flex flex-col px-2 text-center border-2 border-t-0 rounded-sm rounded-t-none bg-primary-default border-tertiary text-shadow-default">
                <li className="p-2 border-b-2 border-b-tertiary">
                  <a href="#">Discord</a>
                </li>
                <li className="p-2 border-b-2 border-b-tertiary">
                  <a href="#">X (Twitter)</a>
                </li>
                <li className="p-2 border-b-2 border-b-tertiary">
                  <a href="#">Facebook</a>
                </li>
                <li className="p-2">
                  <a href="#">Instagram</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div>
          <div className="p-2 font-bold text-center border-2 rounded-sm rounded-b-none bg-primary-default border-tertiary text-shadow-default">
            <h3 className="text-shadow-highlight">Outros links</h3>
          </div>
          <div>
            <ul className="flex flex-col px-2 text-center border-2 border-t-0 rounded-sm rounded-t-none bg-primary-default border-tertiary text-shadow-default">
              <li className="p-2 border-b-2 border-b-tertiary">
                <a href="#">Sobre</a>
              </li>
              <li className="p-2 border-b-2 border-b-tertiary">
                <a href="#">Contato</a>
              </li>
              <li className="p-2">
                <a href="#">Termos de uso</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="p-2 text-xs text-center border-t-2 bg-primary-default border-t-tertiary text-shadow-default">
        <p>&copy; 2024 Manga Reader. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
