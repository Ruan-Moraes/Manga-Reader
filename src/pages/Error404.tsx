import Main from '../layouts/Main';

import Warning from '../components/notifications/Warning';

const Error404 = () => {
  return (
    <Main>
      <Warning
        title="Error 404"
        message="Não há nada aqui, você está perdido? Clique no link abaixo para voltar para a página inicial."
        color="quinary"
        link="/"
        linkText="Voltar para a página inicial"
      />
    </Main>
  );
};

export default Error404;
