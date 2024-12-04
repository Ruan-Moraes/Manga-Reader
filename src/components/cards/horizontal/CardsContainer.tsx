import useFetchArtWork from '../../../hooks/useFetchArtWork';

import Section_Title from '../../titles/SectionTitle';
import SkeletonCard from './SkeletonCard';
import Card from './Card';

interface ICardsContainer {
  queryKey: string;
  url: string;
  validTime?: number;
  title: string;
  sub: string;
}

interface IRandomTitles {
  id: string;
  type: string;
  imageSrc: string;
  chapters: string;
  title: string;
  objectFit?: string;
}

const CardsContainer = ({
  queryKey,
  url,
  validTime,
  title,
  sub,
}: ICardsContainer) => {
  const { data, status } = useFetchArtWork<IRandomTitles[]>(
    queryKey,
    url,
    validTime
  );

  return (
    <section className="flex flex-col gap-4">
      <Section_Title title={title} sub={sub} />
      <div className="flex gap-4 overflow-x-auto flex-nowrap">
        {status === 'pending' &&
          Array.from({ length: 10 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        {status === 'error' && <p>Ocorreu um erro ao buscar os dados</p>}
        {status === 'success' &&
          Array.isArray(data) &&
          data.length > 0 &&
          data.map((item) => (
            <Card
              key={item.id}
              id={item.id}
              title={item.title}
              type={item.type}
              imageSrc={item.imageSrc}
              chapters={item.chapters}
              objectFit={item.objectFit}
            />
          ))}
      </div>
    </section>
  );
};

export default CardsContainer;
