// @ts-expect-error - ignore import error
import { SplideSlide } from '@splidejs/react-splide';

const SlideItem = ({
  // props
  srcImage,
  title,
  synopsis,
}: {
  srcImage: string;
  title: string;
  synopsis: string;
}) => {
  return (
    <SplideSlide>
      <div className="h-full">
        <div className="h-full">
          <img src={srcImage} alt="#" className="object-cover h-[18rem]" />
        </div>
        <div className="absolute bottom-0 left-[50%] -translate-x-2/4 w-full p-2 text-center bg-primary-opacity-50 max-h-[12.5rem]">
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="overflow-hidden text-xs max-h-[3.175rem]">{synopsis}</p>
        </div>
      </div>
    </SplideSlide>
  );
};

export default SlideItem;
