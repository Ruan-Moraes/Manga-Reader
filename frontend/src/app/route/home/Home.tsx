import { COLORS } from '@shared/constant/COLORS';
import { SOCIAL_MEDIA_COLORS } from '@shared/constant/SOCIAL_MEDIA_COLORS';

import Header from '@app/layout/Header';
import Main from '@app/layout/Main';
import Footer from '@app/layout/Footer';

import Warning from '@shared/component/notification/Warning';

import SocialMediasContainer from '@shared/component/social-media/SocialMediasContainer';
import SocialMedia from '@shared/component/social-media/SocialMedia';
import {
    CarouselContainer,
    HighlightCardsContainer,
    HorizontalCardsContainer as RowCardsContainer,
    VerticalCardsContainer as GridCardsContainer,
} from '@feature/manga';

const Home = () => {
    return (
        <>
            <Header />
            <Main>
                <Warning
                    color={COLORS.QUATERNARY}
                    title="Atenção!"
                    message="Site em desenvolvimento, algumas funcionalidades podem não estar disponíveis."
                />
                <SocialMediasContainer>
                    <SocialMedia
                        color={SOCIAL_MEDIA_COLORS.DISCORD}
                        link="#"
                        name="Discord"
                    />
                    <SocialMedia
                        color={SOCIAL_MEDIA_COLORS.X}
                        link="#"
                        name="X (Twitter)"
                    />
                    <SocialMedia
                        color={SOCIAL_MEDIA_COLORS.FACEBOOK}
                        link="#"
                        name="Facebook"
                        className="rounded-bl-xs"
                    />
                    <SocialMedia
                        color={SOCIAL_MEDIA_COLORS.INSTAGRAM}
                        link="#"
                        name="Instagram"
                        className="rounded-br-xs"
                    />
                </SocialMediasContainer>
                <CarouselContainer
                    title="Obras mais vistas"
                    subTitle="Últimos 30 dias"
                />
                <HighlightCardsContainer
                    title="Tops 5 obras em ascensão"
                    subTitle="Quero ver mais..."
                />
                <RowCardsContainer
                    title="10 Obras aleatórias"
                    subTitle="Quero ver mais..."
                />
                <GridCardsContainer
                    title="Obras Atualizadas"
                    subTitle="Quero ver mais..."
                />
            </Main>
            <Footer />
        </>
    );
};

export default Home;
