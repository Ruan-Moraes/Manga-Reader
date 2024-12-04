import UseFetchArtWork from '../../../hooks/useFetchArtWork';

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

interface ITitlesInAscension {
  id: string;
  type: string;
  imageSrc: string;
  title: string;
  popularity: string;
  score: string;
  chapters: string;
  author: string;
  artist: string;
  publisher: string;
  synopsis: string;
  objectFit?: string;
}

const CardsContainer = ({
  queryKey,
  url,
  validTime,
  title,
  sub,
}: ICardsContainer) => {
  const { data, status } = UseFetchArtWork<ITitlesInAscension[]>(
    queryKey,
    url,
    validTime
  );

  return (
    <section className="flex flex-col gap-4">
      <Section_Title title={title} sub={sub} />
      <div className="flex flex-col gap-4">
        {status === 'pending' &&
          Array.from({ length: 5 }).map((_, index) => (
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
              popularity={item.popularity}
              score={item.score}
              chapters={item.chapters}
              author={item.author}
              artist={item.artist}
              publisher={item.publisher}
              synopsis={item.synopsis}
              objectFit={item.objectFit}
            />
          ))}
      </div>
    </section>
  );
};

export default CardsContainer;
