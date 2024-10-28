// @ts-expect-error - ignore import error
import { SplideSlide } from '@splidejs/react-splide';

const SlideItem = ({
  imageSrc,
  title,
  synopsis,
}: {
  imageSrc: string;
  title: string;
  synopsis: string;
}) => {
  return (
    <SplideSlide>
      <div className="h-full">
        <div className="h-full">
          <img src={imageSrc} alt="#" className="object-cover h-[18rem]" />
        </div>
        <div className="absolute bottom-0 left-[50%] -translate-x-2/4 w-full p-2 text-center bg-primary-opacity-50 max-h-[12.5rem]">
          <h3 className="text-lg font-bold">{title}</h3>
          <p
            className="text-xs max-h-[3.15rem] overflow-y-hidden"
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

export default SlideItem;