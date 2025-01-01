import { useMemo, useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (splideRef.current) {
      const { root, track, list } =
        splideRef.current.splide.Components.Elements;

      if (root && track && list) {
        root.classList.add('h-full');
        track.classList.add('h-full');
        list.classList.add('h-full');
      }
    }
  }, [data]);

  const allChildren = useMemo(() => {
    if (status === 'success' && Array.isArray(data) && data.length > 0) {
      return (
        <Splide
          options={{
            type: 'fade',
            rewind: true,
            autoplay: true,
            interval: 5000,
            speed: 300,
            pauseOnHover: true,
            pauseOnFocus: true,
            pagination: false,
            arrows: true,
            classes: {
              arrow: `rounded-sm align-middle flex z-10 cursor-pointer w-8 px-2 py-2 bg-primary-opacity-85 absolute top-1/2 transform -translate-y-1/2 border-2 border-tertiary`,
            },
          }}
          ref={splideRef}
        >
          {data.map(({ id, title, cover, synopsis }) => (
            <Carousel
              id={id}
              title={title}
              cover={cover}
              synopsis={synopsis}
              key={id}
            />
          ))}
        </Splide>
      );
    }

    if (status === 'pending') {
      return <Carousel isLoading={true} />;
    }

    return <Carousel isError={true} />;
  }, [data, status]);

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