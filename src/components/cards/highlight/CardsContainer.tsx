import { useMemo } from 'react';

import UseFetchArtWork from '../../../hooks/useFetchArtWork';

import { CardsContainerProps } from '../../../types/CardContainerProps';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';

const CardsContainer = ({
  queryKey,
  url,
  validTime,
  title,
  subTitle,
}: CardsContainerProps) => {
  const { data, status } = UseFetchArtWork(queryKey, url, validTime);

  const allChildren = useMemo(() => {
    if (status === 'success' && Array.isArray(data) && data.length > 0) {
      return data.map((item) => (
        <Card
          artist={item.artist}
          author={item.author}
          chapters={item.chapters}
          id={item.id}
          imageSrc={item.imageSrc}
          key={item.id}
          popularity={item.popularity}
          publisher={item.publisher}
          score={item.score}
          synopsis={item.synopsis}
          title={item.title}
          type={item.type}
        />
      ));
    }

    if (status === 'pending') {
      return Array.from({ length: 5 }).map((_, index) => (
        <Card isLoading key={index} />
      ));
    }

    return <Card isError />;
  }, [data, status]);

  return (
    <section className="flex flex-col gap-4">
      <Section_Title
        subLink="/categories?sort=ascension&status=all"
        subTitle={subTitle}
        title={title}
      />
      <div className="flex flex-col gap-4">{allChildren}</div>
    </section>
  );
};

export default CardsContainer;
