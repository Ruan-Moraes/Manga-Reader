import { useState, useCallback, useEffect } from 'react';

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
import HorizontalCards from '../../components/cards/horizontal/CardsContainer';
import VerticalCards from '../../components/cards/vertical/CardsContainer';

import HighlightCard from '../../components/cards/highlight/Card';
import HorizontalCard from '../../components/cards/horizontal/Card';
import VerticalCard from '../../components/cards/vertical/Card';

interface IMostViewedHqs {
  id: number;
  imageSrc: string;
  title: string;
  synopsis: string;
}

interface IHqsInAscension {
  id: number;
  type: string;
  imageSrc: string;
  title: string;
  popularity: string;
  score: string;
  chapters: string;
  author: string;
  artist: string;
  publisher: string;
  synopsis: string;
  objectFit?: string;
}

interface IRandomHqs {
  id: number;
  type: string;
  imageSrc: string;
  chapters: string;
  title: string;
  objectFit?: string;
}

interface IUpdatedHqs {
  id: number;
  type: string;
  imageSrc: string;
  title: string;
  releaseDate: string;
  chapters: string;
  objectFit?: string;
}

const Home = () => {
  const [mostViewedHqs, setMostViewedHqs] = useState<IMostViewedHqs[]>([]);
  const [hqsInAscension, setHqsInAscension] = useState<IHqsInAscension[]>([]);
  const [randomHqs, setRandomHqs] = useState<IRandomHqs[]>([]);
  const [updatedHqs, setUpdatedHqs] = useState<IUpdatedHqs[]>([]);

  const fetchMostViewedHqs = useCallback(async (): Promise<
    IMostViewedHqs[]
  > => {
    // Mock data fetching
    return [
      {
        id: Math.floor(Math.random() * 1000000),
        title: 'Solo Leveling',
        synopsis:
          'Sung Jin-woo, um caçador de nível baixo, é considerado o caçador mais fraco de toda a humanidade. Certo dia, ele se depara com uma masmorra dupla, que tem uma masmorra de nível alto escondida dentro de uma masmorra de nível baixo. Diante de um Jinwoo gravemente ferido, surge uma misteriosa missão!',
        imageSrc: 'https://images.alphacoders.com/135/1359819.jpeg',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        title: 'Shingeki no Kyojin',
        synopsis:
          'Attack on Titan se passa em um mundo onde a humanidade vive dentro de cidades cercadas por enormes Muralhas que os protegem dos Titãs, criaturas humanóides gigantes que devoram humanos aparentemente sem motivo. A história gira em torno de Eren Jaeger, sua irmã adotiva Mikasa Ackerman e seu amigo de infância Armin Arlert, cujas vidas mudam para sempre após o aparecimento de um Titã Colossal, que provoca a destruição de sua cidade natal e a morte da mãe de Eren. Jurando vingança e recuperar o mundo dos Titãs, Eren, Mikasa e Armin se juntam a Divisão de Reconhecimento, um grupo de elite de soldados que lutam contra Titãs fora das Muralhas.',
        imageSrc: 'https://images8.alphacoders.com/108/1081458.jpg',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        title: 'Naruto Clássico',
        synopsis:
          'Naruto (ナルト) é uma série de mangá escrita e ilustrada por Masashi Kishimoto, que conta a história de Naruto Uzumaki, um jovem ninja que constantemente procura por reconhecimento e sonha em se tornar Hokage, o ninja líder de sua vila.',
        imageSrc:
          'https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        title: 'One Piece',
        synopsis:
          'A história acompanha Monkey D. Luffy, um jovem cujo corpo ganhou as propriedades de borracha após ter comido uma fruta do diabo por engano. Com sua tripulação, os Piratas do Chapéu de Palha, Luffy explora a Grand Line em busca do One Piece, o maior tesouro do mundo, para se tornar o próximo Rei dos Piratas.',
        imageSrc: 'https://images3.alphacoders.com/134/1342304.jpeg',
      },
    ];
  }, []);

  const fetchHqsInAscension = useCallback(async (): Promise<
    IHqsInAscension[]
  > => {
    // Mock data fetching
    return [
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        title: 'Solo Leveling',
        imageSrc: 'https://images.alphacoders.com/135/1359819.jpeg',
        popularity: '1',
        score: '9.8',
        chapters: '180',
        author: 'Chugong',
        artist: 'Jang Sung-Rak',
        publisher: 'D&C Media',
        synopsis:
          'Sung Jin-woo, um caçador de nível baixo, é considerado o caçador mais fraco de toda a humanidade. Certo dia, ele se depara com uma masmorra dupla, que tem uma masmorra de nível alto escondida dentro de uma masmorra de nível baixo. Diante de um Jinwoo gravemente ferido, surge uma misteriosa missão!',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Shingeki no Kyojin',
        imageSrc: 'https://images8.alphacoders.com/108/1081458.jpg',
        popularity: '2',
        score: '9.6',
        chapters: '139',
        author: 'Hajime Isayama',
        artist: 'Hajime Isayama',
        publisher: 'Kodansha',
        synopsis:
          'Attack on Titan se passa em um mundo onde a humanidade vive dentro de cidades cercadas por enormes Muralhas que os protegem dos Titãs, criaturas humanóides gigantes que devoram humanos aparentemente sem motivo. A história gira em torno de Eren Jaeger, sua irmã adotiva Mikasa Ackerman e seu amigo de infância Armin Arlert, cujas vidas mudam para sempre após o aparecimento de um Titã Colossal, que provoca a destruição de sua cidade natal e a morte da mãe de Eren. Jurando vingança e recuperar o mundo dos Titãs, Eren, Mikasa e Armin se juntam a Divisão de Reconhecimento, um grupo de elite de soldados que lutam contra Titãs fora das Muralhas.',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Naruto Clássico',
        imageSrc:
          'https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp',
        popularity: '3',
        score: '9.5',
        chapters: '700',
        author: 'Masashi Kishimoto',
        artist: 'Masashi Kishimoto',
        publisher: 'Shonen Jump+ (Shueisha)',
        synopsis:
          'Naruto (ナルト) é uma série de mangá escrita e ilustrada por Masashi Kishimoto, que conta a história de Naruto Uzumaki, um jovem ninja que constantemente procura por reconhecimento e sonha em se tornar Hokage, o ninja líder de sua vila.',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Dandandan',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1990/139975l.jpg',
        popularity: '4',
        score: '9.4',
        chapters: '100',
        author: 'Yukinobu Tatsu',
        artist: 'Yukinobu Tatsu',
        publisher: 'Shonen Jump+ (Shueisha)',
        synopsis:
          'Momo Ayase é uma estudante do ensino médio que acredita em fantasmas que vêm de uma família de médiuns, enquanto Ken Takakura (apelidado de Okarun, abreviação de Occult-kun), acredita em alienígenas. Os dois discordam um do outro, com Momo não acreditando em alienígenas e Okarun não acreditando em espíritos.',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Tokyo Ghoul',
        imageSrc:
          'https://cdn.myanimelist.net/images/anime/6/74916l.jpg?_gl=1*119kumj*_gcl_au*MTQxNzU4NDYwMy4xNzMwNTgyMjEy*_ga*NzQ0MDI0MjM3LjE3MzA1ODIyMDU.*_ga_26FEP9527K*MTczMjczMTU3NS41LjEuMTczMjczMTk2MS41OC4wLjA.',
        popularity: '5',
        score: '9.3',
        chapters: '143',
        author: 'Sui Ishida',
        artist: 'Sui Ishida',
        publisher: 'Young Jump (Shueisha)',
        synopsis:
          'Tokyo Ghoul é uma série de mangá escrita e ilustrada por Sui Ishida. A história segue Ken Kaneki, um estudante universitário que quase morre em um encontro às cegas com Rize Kamishiro, uma mulher que se revela um Ghoul. Kaneki é levado ao hospital em estado crítico. Depois de recuperar a consciência, ele descobre que passou por uma cirurgia que o transformou em meio-Ghoul. Isso o transforma em um ser híbrido, meio humano e meio Ghoul, e ele é forçado a viver escondido dos humanos.',
        objectFit: 'fill',
      },
    ];
  }, []);

  const fetchRandomHqs = useCallback(async (): Promise<IRandomHqs[]> => {
    // Mock data fetching
    return [
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        chapters: '1600',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1460/110427l.jpg',
        title: 'One Piece',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        chapters: '180',
        imageSrc: 'https://images.alphacoders.com/135/1359819.jpeg',
        title: 'Solo Leveling',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhua',
        chapters: '400',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/7/85886l.jpg',
        title: 'Tales of Demons and Gods',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        chapters: '139',
        imageSrc: 'https://images8.alphacoders.com/108/1081458.jpg',
        title: 'Shingeki no Kyojin',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        chapters: '200',
        imageSrc: 'https://cdn.myanimelist.net/images/manga/1/257841l.jpg',
        title: 'Tower of God',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhua',
        chapters: '300',
        imageSrc: 'https://cdn.myanimelist.net/images/manga/1/205814l.jpg',
        title: 'The God of High School',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        chapters: '1000',
        imageSrc:
          'https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp',
        title: 'Naruto Clássico',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        chapters: '150',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1883/146143l.jpg',
        title: 'The Beginning After the End',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        chapters: '50',
        imageSrc:
          'https://i0.wp.com/irisscanlator.com.br/wp-content/uploads/2023/07/001.png',
        title:
          'Fukushuu o Koinegau Saikyou Yuusha wa, Yami no Chikara de Senmetsu Musou Suru',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        chapters: '800',
        imageSrc: 'https://cdn.myanimelist.net/images/manga/3/180022l.jpg',
        title: 'Bleach',
      },
    ];
  }, []);

  const fetchUpdatedHqs = useCallback(async (): Promise<IUpdatedHqs[]> => {
    // Mock data fetching
    return [
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        title: 'The Beginning After The End',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1883/146143l.jpg',
        chapters: '100/99/98.5',
        releaseDate: '07/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Shingeki no Kyojin',
        imageSrc: 'https://images8.alphacoders.com/108/1081458.jpg',
        chapters: '139/138/137',
        releaseDate: '06/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Naruto Clássico',
        imageSrc:
          'https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp',
        chapters: '700/699/698',
        releaseDate: '05/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        title: 'Solo Leveling',
        imageSrc: 'https://images.alphacoders.com/135/1359819.jpeg',
        chapters: '155/154/153',
        releaseDate: '04/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title:
          'Fukushuu o Koinegau Saikyou Yuusha wa Yami no Chikara de Senmetsu Musou Suru',
        imageSrc:
          'https://i0.wp.com/irisscanlator.com.br/wp-content/uploads/2023/07/001.png',
        chapters: '10/9/8',
        releaseDate: '03/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        title: 'Tower of God',
        imageSrc: 'https://cdn.myanimelist.net/images/manga/1/257841l.jpg',
        chapters: '500/499/498',
        releaseDate: '02/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhua',
        title: 'Tales of Demons and Gods',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/7/85886l.jpg',
        chapters: '300/299/298',
        releaseDate: '01/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhua',
        title: 'The God of High School',
        imageSrc: 'https://cdn.myanimelist.net/images/manga/1/205814l.jpg',
        chapters: '500/499/498',
        releaseDate: '29/08',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'One Piece',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1460/110427l.jpg',
        chapters: '1000/999/998',
        releaseDate: '28/08',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Blue Lock',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1358/143377l.jpg',
        chapters: '50/49/48',
        releaseDate: '27/08',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        title: 'The Beginning After The End',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1883/146143l.jpg',
        chapters: '100/99/98.5',
        releaseDate: '07/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Shingeki no Kyojin',
        imageSrc: 'https://images8.alphacoders.com/108/1081458.jpg',
        chapters: '139/138/137',
        releaseDate: '06/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Naruto Clássico',
        imageSrc:
          'https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp',
        chapters: '700/699/698',
        releaseDate: '05/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        title: 'Solo Leveling',
        imageSrc: 'https://images.alphacoders.com/135/1359819.jpeg',
        chapters: '155/154/153',
        releaseDate: '04/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title:
          'Fukushuu o Koinegau Saikyou Yuusha wa Yami no Chikara de Senmetsu Musou Suru',
        imageSrc:
          'https://i0.wp.com/irisscanlator.com.br/wp-content/uploads/2023/07/001.png',
        chapters: '10/9/8',
        releaseDate: '03/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        title: 'Tower of God',
        imageSrc: 'https://cdn.myanimelist.net/images/manga/1/257841l.jpg',
        chapters: '500/499/498',
        releaseDate: '02/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhua',
        title: 'Tales of Demons and Gods',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/7/85886l.jpg',
        chapters: '300/299/298',
        releaseDate: '01/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhua',
        title: 'The God of High School',
        imageSrc: 'https://cdn.myanimelist.net/images/manga/1/205814l.jpg',
        chapters: '500/499/498',
        releaseDate: '29/08',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'One Piece',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1460/110427l.jpg',
        chapters: '1000/999/998',
        releaseDate: '28/08',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Blue Lock',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1358/143377l.jpg',
        chapters: '50/49/48',
        releaseDate: '27/08',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        title: 'The Beginning After The End',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1883/146143l.jpg',
        chapters: '100/99/98.5',
        releaseDate: '07/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Shingeki no Kyojin',
        imageSrc: 'https://images8.alphacoders.com/108/1081458.jpg',
        chapters: '139/138/137',
        releaseDate: '06/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Naruto Clássico',
        imageSrc:
          'https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp',
        chapters: '700/699/698',
        releaseDate: '05/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        title: 'Solo Leveling',
        imageSrc: 'https://images.alphacoders.com/135/1359819.jpeg',
        chapters: '155/154/153',
        releaseDate: '04/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title:
          'Fukushuu o Koinegau Saikyou Yuusha wa Yami no Chikara de Senmetsu Musou Suru',
        imageSrc:
          'https://i0.wp.com/irisscanlator.com.br/wp-content/uploads/2023/07/001.png',
        chapters: '10/9/8',
        releaseDate: '03/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhwa',
        title: 'Tower of God',
        imageSrc: 'https://cdn.myanimelist.net/images/manga/1/257841l.jpg',
        chapters: '500/499/498',
        releaseDate: '02/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhua',
        title: 'Tales of Demons and Gods',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/7/85886l.jpg',
        chapters: '300/299/298',
        releaseDate: '01/09',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manhua',
        title: 'The God of High School',
        imageSrc: 'https://cdn.myanimelist.net/images/manga/1/205814l.jpg',
        chapters: '500/499/498',
        releaseDate: '29/08',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'One Piece',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1460/110427l.jpg',
        chapters: '1000/999/998',
        releaseDate: '28/08',
      },
      {
        id: Math.floor(Math.random() * 1000000),
        type: 'Manga',
        title: 'Blue Lock',
        imageSrc: 'https://cdn.myanimelist.net/images/anime/1358/143377l.jpg',
        chapters: '50/49/48',
        releaseDate: '27/08',
      },
    ];
  }, []);

  useEffect(() => {
    // API calls
    fetchMostViewedHqs().then(setMostViewedHqs);
    fetchHqsInAscension().then(setHqsInAscension);
    fetchRandomHqs().then(setRandomHqs);
    fetchUpdatedHqs().then(setUpdatedHqs);
  }, [
    fetchMostViewedHqs,
    fetchHqsInAscension,
    fetchRandomHqs,
    fetchUpdatedHqs,
  ]);

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
        <Carousel>
          {mostViewedHqs.map((item) => (
            <CarouselItem
              key={item.id}
              title={item.title}
              synopsis={item.synopsis}
              imageSrc={item.imageSrc}
            />
          ))}
        </Carousel>
        <HighlightCards
          title="Tops 5 obras em ascensão"
          sub="Quero ver mais..."
        >
          {hqsInAscension.map((item) => (
            <HighlightCard
              key={item.id}
              title={item.title}
              type={item.type}
              imageSrc={item.imageSrc}
              popularity={item.popularity}
              score={item.score}
              chapters={item.chapters}
              author={item.author}
              artist={item.artist}
              publisher={item.publisher}
              synopsis={item.synopsis}
              objectFit={item.objectFit}
            />
          ))}
        </HighlightCards>
        <HorizontalCards title="10 Obras aleatórias" sub="Quero ver mais...">
          {randomHqs.map((item) => (
            <HorizontalCard
              key={item.title}
              type={item.type}
              chapters={item.chapters}
              imageSrc={item.imageSrc}
              title={item.title}
            />
          ))}
        </HorizontalCards>
        <VerticalCards title="Obras Atualizadas" sub="Quero ver mais...">
          {updatedHqs.map((item) => (
            <VerticalCard
              key={item.id}
              type={item.type}
              title={item.title}
              imageSrc={item.imageSrc}
              chapters={item.chapters}
              releaseDate={item.releaseDate}
            />
          ))}
        </VerticalCards>
      </Main>
      <Footer />
    </>
  );
};

export default Home;
