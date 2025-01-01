import { useMemo } from 'react';

import useFetchArtWork from '../../../hooks/useFetchArtWork';

import { CardsContainerTypes } from '../../../types/CardContainerTypes';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';

const CardsContainer = ({
  queryKey,
  url,
  validTime,
  title,
  subTitle,
}: CardsContainerTypes) => {
  const { data, status } = useFetchArtWork(queryKey, url, validTime);

  const allChildren = useMemo(() => {
    if (status === 'success' && Array.isArray(data) && data.length > 0) {
      return data.map(({ id, type, cover, title, chapters }) => (
        <Card
          chapters={chapters}
          id={id}
          cover={cover}
          key={id}
          title={title}
          type={type}
        />
      ));
    }

    if (status === 'pending') {
      return Array.from({ length: 10 }).map((_, index) => (
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
        subLink="/categories?sort=random&status=all"
      />
      <div className="flex gap-4 overflow-x-auto flex-nowrap scrollbar-hidden">
        {allChildren}
      </div>
    </section>
  );
};

export default CardsContainer;
