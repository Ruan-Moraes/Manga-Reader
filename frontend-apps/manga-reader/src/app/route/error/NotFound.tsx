import MainContent from '@/app/layout/Main';

import { THEME_COLORS } from '@shared/constant/THEME_COLORS';
import AlertBanner from '@shared/component/notification/AlertBanner';

const NotFound = () => {
    return (
        <MainContent>
            <AlertBanner
                linkText="Voltar para a página inicial"
                color={THEME_COLORS.QUINARY}
                title="Ops! Página não encontrada."
                message="Não há nada aqui, você está perdido? Clique no link abaixo para voltar para a página inicial."
                link="/"
            />
        </MainContent>
    );
};

export default NotFound;
