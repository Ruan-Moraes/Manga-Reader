import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('manga');

    return (
        <>
            <Header />
            <MainContent>
                <AlertBanner
                    color={THEME_COLORS.QUATERNARY}
                    title={t('home.alertTitle')}
                    message={t('home.alertMessage')}
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
                    title={t('home.carouselTitle')}
                    subTitle={t('home.carouselSubtitle')}
                />
                <HighlightCardsContainer
                    title={t('home.risingTitle')}
                    subTitle={t('home.seeMore')}
                />
                <RowCardsContainer
                    title={t('home.randomTitle')}
                    subTitle={t('home.seeMore')}
                />
                <GridCardsContainer
                    title={t('home.updatedTitle')}
                    subTitle={t('home.seeMore')}
                />
            </MainContent>
            <Footer />
        </>
    );
};

export default Home;
