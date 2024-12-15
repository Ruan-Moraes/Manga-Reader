// @ts-expect-error - ignore import error
import { SplideSlide } from '@splidejs/react-splide';

import CustomLinkBase from '../../links/elements/CustomLinkBase';

type Status = {
  isError?: boolean;
  isLoading?: boolean;
};

type CarouselProps = {
  id?: string;
  imageSrc?: string;
  synopsis?: string;
  title?: string;
};

const Carousel = ({
  id,
  imageSrc,
  title,
  synopsis,
  isLoading,
  isError,
}: CarouselProps & Status) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="font-bold text-center text-tertiary">Carregando...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="p-4 font-bold text-center text-quinary-default">
          Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  return (
    <SplideSlide>
      <div>
        <div>
          <img alt="#" className="object-cover h-[18rem]" src={imageSrc!} />
        </div>
        <div className="absolute bottom-0 left-[50%] -translate-x-2/4 w-full p-2 text-center bg-primary-opacity-75 max-h-[12.5rem]">
          <h3 className="text-lg font-bold text-shadow-highlight">
            <CustomLinkBase
              href={`/titles/${id!}`}
              className="hover:text-shadow-default"
              text={title!}
            />
          </h3>
          <p
            className="text-xs max-h-[3.15rem] overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {synopsis!}
          </p>
        </div>
      </div>
    </SplideSlide>
  );
};

export default Carousel;
