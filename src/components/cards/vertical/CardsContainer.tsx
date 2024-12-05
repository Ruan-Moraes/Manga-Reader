import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import clsx from 'clsx';

import UseFetchArtWork from '../../../hooks/useFetchArtWork';

import { COLORS } from '../../../constants/COLORS';

import Section_Title from '../../titles/SectionTitle';
import ButtonHighLight from '../../buttons/RaisedButton';
import SkeletonCard from './SkeletonCard';
import Warning from '../../notifications/Warning';
import Card from './Card';

interface ICardsContainer {
  queryKey: string;
  url: string;
  validTime?: number;
  title: string;
  sub: string;
}

interface IUpdatedTitles {
  id: string;
  type: string;
  imageSrc: string;
  title: string;
  releaseDate: string;
  chapters: string;
  objectFit?: string;
}

const CardsContainer = ({
  queryKey,
  url,
  validTime,
  title,
  sub,
}: ICardsContainer) => {
  const [visible, setVisible] = useState(10);
  const { data, status } = UseFetchArtWork<IUpdatedTitles[]>(
    queryKey,
    url,
    validTime
  );

  const allChildren = useMemo(() => {
    if (status === 'success' && Array.isArray(data) && data.length > 0) {
      return data.map(
        ({ id, title, type, imageSrc, releaseDate, chapters, objectFit }) => (
          <Card
            key={id}
            id={id}
            title={title}
            type={type}
            imageSrc={imageSrc}
            releaseDate={releaseDate}
            chapters={chapters}
            objectFit={objectFit}
          />
        )
      );
    }
    return [];
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
        className={clsx('grid grid-cols-2 gap-4', {
          'grid-cols-1': status === 'error',
        })}
      >
        {status === 'pending' && (
          <>
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </>
        )}
        {status === 'error' && (
          <Warning
            title="Erro!"
            message="Ocorreu um erro ao carregar os dados. Tente novamente mais tarde."
            color={COLORS.QUINARY}
          />
        )}
        {status === 'success' && allChildren.slice(0, visible)}
      </div>
      <ButtonHighLight text="Ver Mais" callBack={handleClick} />
    </section>
  );
};

export default CardsContainer;
