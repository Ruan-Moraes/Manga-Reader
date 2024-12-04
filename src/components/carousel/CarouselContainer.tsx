import { useRef, useState, useEffect, useCallback } from 'react';

import useFetchArtWork from '../../hooks/useFetchArtWork';

// @ts-expect-error - ignore import error
import { Splide } from '@splidejs/react-splide';
import Carousel from './Carousel';

interface ICarouselContainer {
  queryKey: string;
  url: string;
  validTime?: number;
}

interface IMostViewedTitles {
  id: string;
  imageSrc: string;
  title: string;
  synopsis: string;
}

const CarouselContainer = ({
  queryKey,
  url,
  validTime,
}: ICarouselContainer) => {
  const splideRef = useRef<Splide>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const handleCarouselClick = useCallback(() => {
    if (splideRef.current) {
      splideRef.current.go('+1');
    }

    if (intervalId) {
      clearInterval(intervalId);
    }

    const newIntervalId = setInterval(() => {
      if (splideRef.current) {
        splideRef.current.go('+1');
      }
    }, 7500);

    setIntervalId(newIntervalId);
  }, [intervalId]);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const { data, status } = useFetchArtWork<IMostViewedTitles[]>(
    queryKey,
    url,
    validTime
  );

  return (
    <section className="flex flex-col items-start">
      <div className="px-4 py-2 rounded-t-sm bg-tertiary">
        <h2 className="flex flex-col items-center text-center">
          <span className="font-bold text-shadow-default">
            Obras mais vistas
          </span>
          <span className="text-xs">(últimos 30 dias)</span>
        </h2>
      </div>
      <div className="w-full border-2 rounded-sm rounded-tl-none border-tertiary h-[18rem] overflow-hidden">
        {status === 'pending' && (
          <div className="flex items-center justify-center h-full p-4">
            <p className="font-bold text-center text-tertiary">Carregando...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center justify-center h-full">
            <p className="p-4 font-bold text-center text-quinary-default">
              Ocorreu um erro ao buscar os dados.
            </p>
          </div>
        )}
        {status === 'success' && Array.isArray(data) && data.length > 0 ? (
          <Splide
            ref={splideRef}
            options={{
              type: 'fade',
              rewind: true,
              autoplay: false,
              speed: 500,
              pagination: false,
              arrows: false,
            }}
            onClick={handleCarouselClick}
          >
            {data.map(({ id, imageSrc, title, synopsis }) => (
              <Carousel
                key={id}
                id={id}
                imageSrc={imageSrc}
                title={title}
                synopsis={synopsis}
              />
            ))}
          </Splide>
        ) : (
          <div className="flex items-center justify-center h-full p-4">
            <p className="font-bold text-center text-tertiary">
              Nenhuma obra encontrada.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CarouselContainer;
