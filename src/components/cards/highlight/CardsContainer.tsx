import { useMemo } from 'react';

import { CardsContainerTypes } from '../../../types/CardContainerTypes';

import UseFetchTitles from '../../../hooks/useFetchTitles';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';

const CardsContainer = ({
  url,
  validTime,
  title,
  subTitle,
}: CardsContainerTypes) => {
  const { data, status } = UseFetchTitles(url, validTime);

  const allChildren = useMemo(() => {
    if (status === 'success') {
      return Object.values(data).map(
        ({
          id,
          type,
          cover,
          title,
          synopsis,
          chapters,
          popularity,
          score,
          author,
          artist,
          publisher,
        }) => (
          <Card
            key={id}
            id={id}
            type={type}
            cover={cover}
            title={title}
            synopsis={synopsis}
            chapters={chapters}
            popularity={popularity}
            score={score}
            author={author}
            artist={artist}
            publisher={publisher}
          />
        )
      );
    }

    if (status === 'pending') {
      return Array.from({ length: 5 }).map((_, index) => (
        <Card isLoading={true} key={index} />
      ));
    }

    return <Card isError={true} />;
  }, [data, status]);

  return (
    <section className="flex flex-col gap-4">
      <Section_Title
        title={title}
        subTitle={subTitle}
        subLink="/categories?sort=ascension&status=all"
      />
      <div className="flex flex-col gap-4">{allChildren}</div>
    </section>
  );
};

export default CardsContainer;
