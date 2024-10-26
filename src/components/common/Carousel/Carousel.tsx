import { useRef } from 'react';

// @ts-expect-error - ignore import error
import { Splide, SplideSlide } from '@splidejs/react-splide';
import SlideItem from './SlideItem';

const Carousel = () => {
  const splideRef = useRef<Splide | null>(null);

  return (
    <div className="flex flex-col items-start">
      <div className="px-4 py-2 rounded-t-sm bg-tertiary">
        <h2 className="flex flex-col items-center">
          <span className="font-bold">Obras mais vistas</span>
          <span className="text-xs">(últimos 30 dias)</span>
        </h2>
      </div>
      <div className="overflow-hidden border-2 rounded-sm rounded-tl-none border-tertiary">
        <Splide
          ref={splideRef}
          options={{
            type: 'fade',
            rewind: true,
            autoplay: true,
            interval: 5000,
            speed: 500,
            pagination: false,
            arrows: false,
          }}
          onClick={() => {
            splideRef.current?.go('+1');
          }}
        >
          <SlideItem
            srcImage="https://images.alphacoders.com/135/1359819.jpeg"
            title="Solo Leveling"
            synopsis="Sung Jinwoo (Aleks Le) é um simples caçador sem habilidades ou
            forças notáveis, mas um dia, após sobreviver a uma batalha que quase
            o levou à morte, é selecionado para um estranho programa chamado
            Sistema, para ser o único a receber raras habilidades, tornando-se
            possivelmente o caçador mais forte já visto."
          />
          <SlideItem
            srcImage="https://images8.alphacoders.com/108/1081458.jpg"
            title="Shingeki no Kyojin"
            synopsis="A história de Shingeki no Kyojin gira em torno de uma humanidade que vem sendo exterminada por gigantes. Porém alguns seres humanos estão dispostos a mudar história e formar um exército de ataque aos seres assassinos. É assim que entra Eren, nosso protagonista, que após ver sua mãe ser devorada por um gigante, decide que não deixará nenhum deles vivo e buscará sua vingança completa."
          />
          <SlideItem
            srcImage="https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp"
            title="Naruto Clássico"
            synopsis="A obra gira em torno das aventuras vividas por Naruto Uzumaki, um jovem órfão habitante da Aldeia da Folha que sonha em se tornar o quinto Hokage, o maior guerreiro e governante da vila."
          />
        </Splide>
      </div>
    </div>
  );
};

export default Carousel;
