import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import clsx from 'clsx';

import { CardsContainerTypes } from '../../../types/CardContainerTypes';

import UseFetchArtWork from '../../../hooks/useFetchArtWork';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';
import ButtonHighLight from '../../buttons/RaisedButton';

const CardsContainer = ({
  queryKey,
  url,
  validTime,
  title,
  subTitle,
}: CardsContainerTypes) => {
  const { data, status } = UseFetchArtWork(queryKey, url, validTime);

  const navigate = useNavigate();
  const [visible, setVisible] = useState(10);

  const allChildren = useMemo(() => {
    if (status === 'success' && Array.isArray(data) && data.length > 0) {
      return data.map(({ id, type, cover, title, chapters, updatedAt }) => (
        <Card
          id={id}
          type={type}
          cover={cover}
          title={title}
          chapters={chapters}
          updatedAt={updatedAt}
          key={id}
        />
      ));
    }

    if (status === 'pending') {
      return Array.from({ length: 10 }).map((_, index) => (
        <Card isLoading={true} key={index} />
      ));
    }

    return Array.from({ length: 1 }).map((_, index) => (
      <Card isError={true} key={index} />
    ));
  }, [data, status]);

  const handleClick = () => {
    if (visible >= allChildren.length) {
      navigate('/Manga-Reader/categories?sort=most_recent&status=all');
    } else {
      setVisible((prev) => prev + 10);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <Section_Title
        title={title}
        subTitle={subTitle}
        subLink="/categories?sort=most_recent&status=all"
      />
      <div
        className={clsx('grid gap-4', {
          'grid-cols-2': status === 'success' || status === 'pending',
          'grid-cols-1': status === 'error',
        })}
      >
        {allChildren.slice(0, visible)}
      </div>
      <ButtonHighLight onClick={handleClick} text="Ver Mais" />
    </section>
  );
};

export default CardsContainer;
