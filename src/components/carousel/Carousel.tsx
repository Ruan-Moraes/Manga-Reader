import { useRef, useState } from 'react';

// @ts-expect-error - ignore import error
import { Splide } from '@splidejs/react-splide';

interface ICarousel {
  children: React.ReactNode;
}

const Carousel = ({ children }: ICarousel) => {
  const splideRef = useRef<Splide>(null);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  const handleCarouselClick = () => {
    splideRef.current?.go('+1');

    if (intervalId) {
      clearInterval(intervalId);
    }

    const newIntervalId = setInterval(() => {
      splideRef.current?.go('+1');
    }, 7500);

    setIntervalId(newIntervalId);
  };

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
      <div className="border-2 rounded-sm rounded-tl-none border-tertiary">
        <Splide
          ref={splideRef}
          options={{
            type: 'fade',
            rewind: true,
            autoplay: true,
            interval: 7500,
            speed: 500,
            pagination: false,
            arrows: false,
          }}
          onClick={handleCarouselClick}
        >
          {children}
        </Splide>
      </div>
    </section>
  );
};

export default Carousel;
