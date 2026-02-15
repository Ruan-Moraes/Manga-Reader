import { COLORS } from '@shared/constant/COLORS';

import Main from '@app/layout/Main';

import Warning from '@shared/component/notification/Warning';

const NotFound = () => {
    return (
        <Main>
            <Warning
                linkText="Voltar para a página inicial"
                color={COLORS.QUINARY}
                title="Ops! Página não encontrada."
                message="Não há nada aqui, você está perdido? Clique no link abaixo para voltar para a página inicial."
                link="/"
            />
        </Main>
    );
};

export default NotFound;
