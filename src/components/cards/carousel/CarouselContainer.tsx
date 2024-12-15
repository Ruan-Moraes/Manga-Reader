import { useMemo, useRef, useState, useEffect, useCallback } from 'react';

import useFetchArtWork from '../../../hooks/useFetchArtWork';

// @ts-expect-error - ignore import error
import { Splide } from '@splidejs/react-splide';
import Carousel from './Carousel';

type CarouselContainerProps = {
  queryKey: string;
  url: string;
  validTime?: number;
  title?: string;
  subTitle?: string;
};

const CarouselContainer = ({
  queryKey,
  url,
  validTime,
  title,
  subTitle,
}: CarouselContainerProps) => {
  const { data, status } = useFetchArtWork(queryKey, url, validTime);

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

  const allChildren = useMemo(() => {
    if (status === 'success' && Array.isArray(data) && data.length > 0) {
      return (
        <Splide
          onClick={handleCarouselClick}
          options={{
            type: 'fade',
            rewind: true,
            autoplay: false,
            speed: 500,
            pagination: false,
            arrows: false,
          }}
          ref={splideRef}
        >
          {data.map(({ id, imageSrc, title, synopsis }) => (
            <Carousel
              id={id}
              imageSrc={imageSrc}
              key={id}
              synopsis={synopsis}
              title={title}
            />
          ))}
        </Splide>
      );
    }

    if (status === 'pending') {
      return <Carousel isLoading />;
    }

    return <Carousel isError />;
  }, [data, status, handleCarouselClick]);

  return (
    <section className="flex flex-col items-start">
      <div className="px-4 py-2 rounded-t-sm bg-tertiary">
        <h2 className="flex flex-col items-center text-center">
          <span className="font-bold text-shadow-default">{title}</span>
          <span className="text-xs">({subTitle})</span>
        </h2>
      </div>
      <div className="w-full border-2 rounded-sm rounded-tl-none border-tertiary h-[18rem] overflow-hidden">
        {allChildren}
      </div>
    </section>
  );
};

export default CarouselContainer;
