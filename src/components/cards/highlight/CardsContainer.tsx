import { useMemo } from 'react';

import UseFetchArtWork from '../../../hooks/useFetchArtWork';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';

type CardsContainerProps = {
  queryKey: string;
  url: string;
  validTime?: number;
  title: string;
  sub: string;
};

type TitlesInAscensionProps = {
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
};

const CardsContainer = ({
  queryKey,
  url,
  validTime,
  title,
  sub,
}: CardsContainerProps) => {
  const { data, status } = UseFetchArtWork<TitlesInAscensionProps[]>(
    queryKey,
    url,
    validTime
  );

  const allChildren = useMemo(() => {
    if (status === 'success' && Array.isArray(data) && data.length > 0) {
      return data.map((item) => (
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
        />
      ));
    }

    if (status === 'pending') {
      return Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} isLoading />
      ));
    }

    return <Card isError />;
  }, [data, status]);

  return (
    <section className="flex flex-col gap-4">
      <Section_Title title={title} sub={sub} />
      <div className="flex flex-col gap-4">{allChildren}</div>
    </section>
  );
};

export default CardsContainer;
