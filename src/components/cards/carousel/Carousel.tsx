import { TitleTypes } from '../../../types/TitleTypes';
import { StatusFetchTypes } from '../../../types/StatusFetchTypes';

// @ts-expect-error - ignore import error
import { SplideSlide } from '@splidejs/react-splide';
import CustomLinkBase from '../../links/elements/CustomLinkBase';

type CarouselProps = Partial<
  Omit<
    TitleTypes,
    | 'createdAt'
    | 'updatedAt'
    | 'popularity'
    | 'score'
    | 'author'
    | 'artist'
    | 'publisher'
    | 'chapters'
    | 'type'
  >
> &
  StatusFetchTypes;

const Carousel = ({
  id,
  cover,
  title,
  synopsis,
  isLoading,
  isError,
}: CarouselProps) => {
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
      <div className="relative h-full">
        <div className="h-full">
          <CustomLinkBase
            href={`/titles/${id}`}
            className="block h-full cursor-default"
          >
            <img
              alt={`Capa do título: ${title}`}
              className="w-full h-full object-fit"
              src={cover}
            />
          </CustomLinkBase>
        </div>
        <div className="absolute bottom-0 left-[50%] -translate-x-2/4 w-full p-2 text-center bg-primary-opacity-85">
          <h3
            className="overflow-hidden text-lg font-bold text-shadow-default"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}
          >
            <CustomLinkBase href={`/titles/${id}`} text={title} />
          </h3>
          <p
            className="overflow-hidden text-xs"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {synopsis}
          </p>
        </div>
      </div>
    </SplideSlide>
  );
};

export default Carousel;
