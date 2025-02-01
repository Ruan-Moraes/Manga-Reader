import { useMemo } from 'react';

import { TitleTypes } from '../../../types/TitleTypes';
import { StatusFetchTypes } from '../../../types/StatusFetchTypes';

import { COLORS } from '../../../constants/COLORS';

import Warning from '../../notifications/Warning';
import CustomLink from '../../links/elements/CustomLink';

type CardTypes = Partial<
  Omit<
    TitleTypes,
    | 'synopsis'
    | 'popularity'
    | 'score'
    | 'author'
    | 'artist'
    | 'publisher'
    | 'createdAt'
    | 'updatedAt'
  >
> &
  StatusFetchTypes;

const Card = ({
  id,
  type = '...',
  cover = 'Carregando...',
  title = '...',
  chapters = '...',
  isError,
  isLoading,
}: CardTypes) => {
  const lastChapter = useMemo(
    // Todo: Alterar quando a API estiver pronta

    () => chapters?.[chapters.length - 1],
    [chapters]
  );

  if (isError) {
    return (
      <Warning
        color={COLORS.QUINARY}
        message="Ocorreu um erro ao carregar os dados. Tente novamente mais tarde."
        title="Erro!"
      />
    );
  }

  return (
    <div className="flex flex-col items-start flex-shrink-0">
      <div className="flex flex-col px-3 py-1 text-center rounded-sm rounded-b-none bg-tertiary">
        <span className="font-bold">{type}</span>
        <span className="text-xs">
          {isLoading ? (
            <span>({chapters} Capítulos)</span>
          ) : (
            <span>({lastChapter} Capítulos)</span>
          )}
        </span>
      </div>
      <div className="border border-b-0 border-tertiary w-[20rem] h-[18rem] relative rounded-tr-sm overflow-hidden">
        {isLoading && (
          <span className="flex items-center justify-center h-full font-bold text-tertiary">
            {cover}
          </span>
        )}
        {!isLoading && (
          <CustomLink href={`/titles/${id}`} className="block h-full">
            <img
              alt={`Capa do título: ${title}`}
              className="object-cover w-full h-full"
              src={cover}
            />
          </CustomLink>
        )}
      </div>
      <div className="w-[20rem] px-2 py-1 rounded-b-sm bg-tertiary">
        {isLoading && (
          <span className="block font-bold text-center text-shadow-default">
            {title}
          </span>
        )}
        {!isLoading && (
          <h3 className="overflow-x-auto text-center text-nowrap">
            <CustomLink
              href={`/titles/${id}`}
              text={title}
              className="text-shadow-default"
            />
          </h3>
        )}
      </div>
    </div>
  );
};

export default Card;
