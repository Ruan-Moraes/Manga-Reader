import { useMemo } from 'react';

import useFetchArtWork from '../../../hooks/useFetchArtWork';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';

type CardsContainerProps = {
  queryKey: string;
  url: string;
  validTime?: number;
  title: string;
  sub: string;
};

type RandomTitlesProps = {
  id: string;
  type: string;
  imageSrc: string;
  chapters: string;
  title: string;
};

const CardsContainer = ({
  queryKey,
  url,
  validTime,
  title,
  sub,
}: CardsContainerProps) => {
  const { data, status } = useFetchArtWork<RandomTitlesProps[]>(
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
          chapters={item.chapters}
        />
      ));
    }

    if (status === 'pending') {
      return Array.from({ length: 10 }).map((_, index) => (
        <Card key={index} isLoading />
      ));
    }

    return <Card isError />;
  }, [data, status]);

  return (
    <section className="flex flex-col gap-4">
      <Section_Title title={title} sub={sub} />
      <div className="flex gap-4 overflow-x-auto flex-nowrap scrollbar-hidden">
        {allChildren}
      </div>
    </section>
  );
};

export default CardsContainer;
