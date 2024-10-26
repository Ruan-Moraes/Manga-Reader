import Warning from '../common/Warnings/Warning';
import Carousel from '../common/Carousel/Carousel';

const Body = () => {
  return (
    <main className="flex flex-col gap-8 p-4 bg-primary-default">
      <Warning />
      <Carousel />
    </main>
  );
};

export default Body;
