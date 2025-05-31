import {COLORS} from '../../constants/COLORS';

import Main from '../../layouts/Main';

import Warning from '../../components/notifications/Warning';

const NotFound = () => {
    return (
        <Main>
            <Warning
                linkText="Voltar para a página inicial"
                color={COLORS.QUINARY}
                title="Error 404"
                message="Não há nada aqui, você está perdido? Clique no link abaixo para voltar para a página inicial."
                link="/"
            />
        </Main>
    );
};

export default NotFound;
