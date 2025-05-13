import { COLORS } from '../../constants/COLORS';

import Main from '../../layouts/Main';

import Warning from '../../components/notifications/Warning';

const News = () => {
  return (
    <>
      <Main>
        <Warning
          linkText="Voltar para a página inicial"
          color={COLORS.QUATERNARY}
          title="Em construção"
          message="Essa página ainda está em construção. Por favor, volte mais tarde."
          link="/"
        />
      </Main>
    </>
  );
};

export default News;
