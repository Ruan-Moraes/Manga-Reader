import { useMemo } from 'react';

import useFetchArtWork from '../../../hooks/useFetchArtWork';

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
  const { data, status } = useFetchArtWork(queryKey, url, validTime);

  const allChildren = useMemo(() => {
    if (status === 'success' && Array.isArray(data) && data.length > 0) {
      return data.map((item) => (
        <Card
          chapters={item.chapters}
          id={item.id}
          imageSrc={item.imageSrc}
          key={item.id}
          title={item.title}
          type={item.type}
        />
      ));
    }

    if (status === 'pending') {
      return Array.from({ length: 10 }).map((_, index) => (
        <Card isLoading key={index} />
      ));
    }

    return <Card isError />;
  }, [data, status]);

  return (
    <section className="flex flex-col gap-4">
      <Section_Title
        subLink="/categories?sort=random&status=all"
        subTitle={subTitle}
        title={title}
      />
      <div className="flex gap-4 overflow-x-auto flex-nowrap scrollbar-hidden">
        {allChildren}
      </div>
    </section>
  );
};

export default CardsContainer;
