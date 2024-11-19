// @ts-expect-error - ignore import error
import '@splidejs/react-splide/css';

import { COLORS } from '../../constants/COLORS';
import { SOCIAL_MEDIA_COLORS } from '../../constants/SOCIAL_MEDIA_COLORS';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import Warning from '../../components/notifications/Warning';

import Carousel from '../../components/carousel/Carousel';
import CarouselItem from '../../components/carousel/CarouselItem';

import SocialMedias from '../../components/social_medias/SocialMediasContainer';
import SocialMediaItem from '../../components/social_medias/SocialMediaItem';

import HighlightCards from '../../components/cards/highlight/CardsContainer';
import HorizontalCard from '../../components/cards/horizontal/CardsContainer';
import VerticalCards from '../../components/cards/vertical/CardsContainer';

const Index = () => {
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
            link="#"
          />
          <SocialMediaItem
            color={SOCIAL_MEDIA_COLORS.X}
            name="X (Twitter)"
            link="#"
          />
          <SocialMediaItem
            color={SOCIAL_MEDIA_COLORS.FACEBOOK}
            name="Facebook"
            link="#"
          />
          <SocialMediaItem
            color={SOCIAL_MEDIA_COLORS.INSTAGRAM}
            name="Instagram"
            link="#"
          />
        </SocialMedias>
        <Carousel>
          <CarouselItem
            imageSrc="https://images.alphacoders.com/135/1359819.jpeg"
            title="Solo Leveling"
            synopsis="Sung Jinwoo (Aleks Le) é um simples caçador sem habilidades ou
            forças notáveis, mas um dia, após sobreviver a uma batalha que quase
            o levou à morte, é selecionado para um estranho programa chamado
            Sistema, para ser o único a receber raras habilidades, tornando-se
            possivelmente o caçador mais forte já visto."
          />
          <CarouselItem
            imageSrc="https://images8.alphacoders.com/108/1081458.jpg"
            title="Shingeki no Kyojin"
            synopsis="A história de Shingeki no Kyojin gira em torno de uma humanidade que vem sendo exterminada por gigantes. Porém alguns seres humanos estão dispostos a mudar história e formar um exército de ataque aos seres assassinos. É assim que entra Eren, nosso protagonista, que após ver sua mãe ser devorada por um gigante, decide que não deixará nenhum deles vivo e buscará sua vingança completa."
          />
          <CarouselItem
            imageSrc="https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp"
            title="Naruto Clássico"
            synopsis="A obra gira em torno das aventuras vividas por Naruto Uzumaki, um jovem órfão habitante da Aldeia da Folha que sonha em se tornar o quinto Hokage, o maior guerreiro e governante da vila."
          />
        </Carousel>
        <HighlightCards
          title="Tops 5 obras em ascensão"
          sub="Quero ver mais..."
        />
        <HorizontalCard title="10 Obras aleatórias" sub="Quero ver mais..." />
        <VerticalCards title="Obras Atualizadas" sub="Quero ver mais..." />
      </Main>
      <Footer />
    </>
  );
};

export default Index;
