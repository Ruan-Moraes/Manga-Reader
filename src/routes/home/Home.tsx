// @ts-expect-error - ignore import error
import '@splidejs/react-splide/css';

import { COLORS } from '../../constants/COLORS';
import { SOCIAL_MEDIA_COLORS } from '../../constants/SOCIAL_MEDIA_COLORS';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import Warning from '../../components/notifications/Warning';

import SocialMediasContainer from '../../components/social-medias/SocialMediasContainer';
import SocialMedia from '../../components/social-medias/SocialMedia';

import CarouselContainer from '../../components/cards/carousel/CarouselContainer';
import HighlightCardsContainer from '../../components/cards/highlight/CardsContainer';
import RowCardsContainer from '../../components/cards/horizontal/CardsContainer';
import GridCardsContainer from '../../components/cards/vertical/CardsContainer';

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
            href="#"
            name="Discord"
          />
          <SocialMedia
            color={SOCIAL_MEDIA_COLORS.X}
            href="#"
            name="X (Twitter)"
          />
          <SocialMedia
            color={SOCIAL_MEDIA_COLORS.FACEBOOK}
            href="#"
            name="Facebook"
          />
          <SocialMedia
            color={SOCIAL_MEDIA_COLORS.INSTAGRAM}
            href="#"
            name="Instagram"
          />
        </SocialMediasContainer>
        <CarouselContainer
          url="https://db-json-ten.vercel.app/titlesCarousel"
          validTime={30}
          title="Obras mais vistas"
          subTitle="Últimos 30 dias"
        />
        <HighlightCardsContainer
          url="https://db-json-ten.vercel.app/titlesMostViewed"
          validTime={30}
          title="Tops 5 obras em ascensão"
          subTitle="Quero ver mais..."
        />
        <RowCardsContainer
          url="https://db-json-ten.vercel.app/randomTitles"
          validTime={30}
          title="10 Obras aleatórias"
          subTitle="Quero ver mais..."
        />
        <GridCardsContainer
          url="https://db-json-ten.vercel.app/updatedTitles"
          validTime={30}
          title="Obras Atualizadas"
          subTitle="Quero ver mais..."
        />
      </Main>
      <Footer />
    </>
  );
};

export default Home;
