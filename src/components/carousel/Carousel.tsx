// @ts-expect-error - ignore import error
import { SplideSlide } from '@splidejs/react-splide';

import CustomLinkBase from '../links/elements/CustomLinkBase';

interface ICarousel {
  id: string;
  imageSrc: string;
  title: string;
  synopsis: string;
}

const Carousel = ({ id, imageSrc, title, synopsis }: ICarousel) => {
  return (
    <SplideSlide>
      <div>
        <div>
          <img src={imageSrc} alt="#" className="object-cover h-[18rem]" />
        </div>
        <div className="absolute bottom-0 left-[50%] -translate-x-2/4 w-full p-2 text-center bg-primary-opacity-75 max-h-[12.5rem]">
          <h3 className="text-lg font-bold text-shadow-highlight">
            <CustomLinkBase
              href={`/title/${id}`}
              text={title}
              otherStyles={{
                textShadow: '0.125rem 0.0625rem 0 #161616bf',
              }}
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
            {synopsis}
          </p>
        </div>
      </div>
    </SplideSlide>
  );
};

export default Carousel;
