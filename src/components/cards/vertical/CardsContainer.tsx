import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import clsx from 'clsx';

import UseFetchArtWork from '../../../hooks/useFetchArtWork';

import { CardsContainerProps } from '../../../types/CardContainerProps';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';
import ButtonHighLight from '../../buttons/RaisedButton';

const CardsContainer = ({
  queryKey,
  url,
  validTime,
  title,
  subTitle,
}: CardsContainerProps) => {
  const [visible, setVisible] = useState(10);
  const { data, status } = UseFetchArtWork(queryKey, url, validTime);

  const allChildren = useMemo(() => {
    if (status === 'success' && Array.isArray(data) && data.length > 0) {
      return data.map(
        ({ id, title, type, imageSrc, releaseDate, chapters }) => (
          <Card
            chapters={chapters}
            id={id}
            imageSrc={imageSrc}
            key={id}
            releaseDate={releaseDate}
            title={title}
            type={type}
          />
        )
      );
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

  const navigate = useNavigate();

  const handleClick = () => {
    if (visible >= allChildren.length) {
      navigate('/Manga-Reader/categories?q=latest');
    } else {
      setVisible((prev) => prev + 10);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <Section_Title
        subLink="/categories?sort=most_recent&status=all"
        subTitle={subTitle}
        title={title}
      />
      <div
        className={clsx('grid gap-4', {
          'grid-cols-2': status === 'success' || status === 'pending',
          'grid-cols-1': status === 'error',
        })}
      >
        {allChildren.slice(0, visible)}
      </div>
      <ButtonHighLight callBack={handleClick} text="Ver Mais" />
    </section>
  );
};

export default CardsContainer;
