import { useMemo } from 'react';

import UseFetchTitle from '../../../hooks/useFetchTitle';

import { CardsContainerTypes } from '../../../types/CardContainerTypes';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';

const CardsContainer = ({
  url,
  validTime,
  title,
  subTitle,
}: CardsContainerTypes) => {
  const { data, status } = UseFetchTitle(url, validTime);

  const allChildren = useMemo(() => {
    if (status === 'success') {
      return Object.values(data).map(({ id, type, cover, title, chapters }) => (
        <Card
          key={id}
          id={id}
          chapters={chapters}
          cover={cover}
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
