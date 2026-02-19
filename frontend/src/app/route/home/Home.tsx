import { THEME_COLORS } from '@shared/constant/THEME_COLORS';
import { SOCIAL_MEDIA_COLORS } from '@shared/constant/SOCIAL_MEDIA_COLORS';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AlertBanner from '@shared/component/notification/AlertBanner';

import SocialMediaSection from '@shared/component/social-media/SocialMediaSection';
import SocialMediaLink from '@shared/component/social-media/SocialMediaLink';

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
            <MainContent>
                <AlertBanner
                    color={THEME_COLORS.QUATERNARY}
                    title="Atenção!"
                    message="Site em desenvolvimento, algumas funcionalidades podem não estar disponíveis."
                />
                <SocialMediaSection>
                    <SocialMediaLink
                        color={SOCIAL_MEDIA_COLORS.DISCORD}
                        link="#"
                        name="Discord"
                    />
                    <SocialMediaLink
                        color={SOCIAL_MEDIA_COLORS.X}
                        link="#"
                        name="X (Twitter)"
                    />
                    <SocialMediaLink
                        color={SOCIAL_MEDIA_COLORS.FACEBOOK}
                        link="#"
                        name="Facebook"
                        className="rounded-bl-xs"
                    />
                    <SocialMediaLink
                        color={SOCIAL_MEDIA_COLORS.INSTAGRAM}
                        link="#"
                        name="Instagram"
                        className="rounded-br-xs"
                    />
                </SocialMediaSection>
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
            </MainContent>
            <Footer />
        </>
    );
};

export default Home;
