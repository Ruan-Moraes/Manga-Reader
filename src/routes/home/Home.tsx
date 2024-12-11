// @ts-expect-error - ignore import error
import '@splidejs/react-splide/css';

import { COLORS } from '../../constants/COLORS';
import { SOCIAL_MEDIA_COLORS } from '../../constants/SOCIAL_MEDIA_COLORS';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import Warning from '../../components/notifications/Warning';

import SocialMedias from '../../components/social-medias/SocialMediasContainer';
import SocialMediaItem from '../../components/social-medias/SocialMediaItem';

import CarouselContainer from '../../components/cards/carousel/CarouselContainer';
import HighlightCards from '../../components/cards/highlight/CardsContainer';
import RowCardsContainer from '../../components/cards/horizontal/CardsContainer';
import GridCardsContainer from '../../components/cards/vertical/CardsContainer';

const Home = () => {
  return (
    <>
      <Header disabledBreadcrumb={true} />
      <Main>
        <Warning
          title="Atenção!"
          message="Site em desenvolvimento, algumas funcionalidades podem não estar disponíveis."
          color={COLORS.QUATERNARY}
        />
        <SocialMedias>
          <SocialMediaItem
            color={SOCIAL_MEDIA_COLORS.DISCORD}
            name="Discord"
            href="#"
          />
          <SocialMediaItem
            color={SOCIAL_MEDIA_COLORS.X}
            name="X (Twitter)"
            href="#"
          />
          <SocialMediaItem
            color={SOCIAL_MEDIA_COLORS.FACEBOOK}
            name="Facebook"
            href="#"
          />
          <SocialMediaItem
            color={SOCIAL_MEDIA_COLORS.INSTAGRAM}
            name="Instagram"
            href="#"
          />
        </SocialMedias>
        <CarouselContainer
          queryKey="mostViewedTitles"
          url="http://localhost:5000/mostViewedTitles"
          validTime={30}
        />
        <HighlightCards
          queryKey="hqsInAscension"
          url="http://localhost:5000/titlesInAscension"
          validTime={30}
          title="Tops 5 obras em ascensão"
          sub="Quero ver mais..."
        />
        <RowCardsContainer
          queryKey="randomTitles"
          url="http://localhost:5000/randomTitles"
          validTime={30}
          title="10 Obras aleatórias"
          sub="Quero ver mais..."
        />

        <GridCardsContainer
          queryKey="updatedTitles"
          url="http://localhost:5000/updatedTitles"
          validTime={30}
          title="Obras Atualizadas"
          sub="Quero ver mais..."
        />
      </Main>
      <Footer />
    </>
  );
};

export default Home;
