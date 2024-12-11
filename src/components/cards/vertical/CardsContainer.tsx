import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import clsx from 'clsx';

import UseFetchArtWork from '../../../hooks/useFetchArtWork';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';
import ButtonHighLight from '../../buttons/RaisedButton';

type CardsContainerProps = {
  queryKey: string;
  url: string;
  validTime?: number;
  title: string;
  sub: string;
};

type UpdatedTitlesProps = {
  id: string;
  type: string;
  imageSrc: string;
  title: string;
  releaseDate: string;
  chapters: string;
};

const CardsContainer = ({
  queryKey,
  url,
  validTime,
  title,
  sub,
}: CardsContainerProps) => {
  const [visible, setVisible] = useState(10);
  const { data, status } = UseFetchArtWork<UpdatedTitlesProps[]>(
    queryKey,
    url,
    validTime
  );

  const allChildren = useMemo(() => {
    if (status === 'success' && Array.isArray(data) && data.length > 0) {
      return data.map(
        ({ id, title, type, imageSrc, releaseDate, chapters }) => (
          <Card
            key={id}
            id={id}
            title={title}
            type={type}
            imageSrc={imageSrc}
            releaseDate={releaseDate}
            chapters={chapters}
          />
        )
      );
    }

    if (status === 'pending') {
      return Array.from({ length: 10 }).map((_, index) => (
        <Card key={index} isLoading={true} />
      ));
    }

    return Array.from({ length: 1 }).map((_, index) => (
      <Card key={index} isError={true} />
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
      <Section_Title title={title} sub={sub} />
      <div
        className={clsx('grid gap-4', {
          'grid-cols-2': status === 'success' || status === 'pending',
          'grid-cols-1': status === 'error',
        })}
      >
        {allChildren.slice(0, visible)}
      </div>
      <ButtonHighLight text="Ver Mais" callBack={handleClick} />
    </section>
  );
};

export default CardsContainer;
