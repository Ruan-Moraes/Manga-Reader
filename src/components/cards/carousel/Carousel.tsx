// @ts-expect-error - ignore import error
import {SplideSlide} from '@splidejs/react-splide';

import {TitleTypes} from '../../../types/TitleTypes';
import {StatusFetchTypes} from '../../../types/StatusFetchTypes';

import CustomLink from '../../links/elements/CustomLink';

type CarouselTypes = Partial<
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
                      isError,
                      isLoading,
                  }: CarouselTypes) => {
    if (isError) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="p-4 font-bold text-center text-quinary-default">
                    Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <p className="font-bold text-center text-tertiary">Carregando...</p>
            </div>
        );
    }

    return (
        <SplideSlide>
            <div className="relative h-full">
                <div className="h-full">
                    <CustomLink
                        link={`/titles/${id}`}
                        className="block h-full cursor-default"
                    >
                        <img
                            alt={`Capa do título: ${title}`}
                            src={cover}
                            className="w-full h-full object-fit"
                        />
                    </CustomLink>
                </div>
                <div
                    className="absolute bottom-0 left-[50%] -translate-x-2/4 w-full p-2 text-center bg-primary-opacity-80">
                    <h3
                        className="overflow-hidden text-lg font-bold text-shadow-default"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        <CustomLink link={`/titles/${id}`} text={title}/>
                    </h3>
                    <p
                        className="overflow-hidden text-xs text-shadow-default"
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
