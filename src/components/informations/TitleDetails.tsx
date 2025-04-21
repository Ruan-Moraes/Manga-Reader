import { useMemo } from 'react';

import { TitleTypes } from '../../types/TitleTypes';
import { StatusFetchTypes } from '../../types/StatusFetchTypes';

import CustomLink from '../links/elements/CustomLink';

type TitleDetailsTypes = Partial<
  Omit<TitleTypes, 'cover' | 'synopsis' | 'genres' | 'createdAt' | 'updatedAt'>
> & { disableType?: boolean } & StatusFetchTypes;

const TitleDetails = ({
  id,
  title,
  type,
  chapters,
  popularity,
  score,
  author,
  artist,
  publisher,
  disableType = false,
  isLoading,
}: TitleDetailsTypes) => {
  const lastChapter = useMemo(
    // TODO: Alterar quando a API estiver pronta

    () => chapters?.[chapters.length - 1],
    [chapters]
  );

  return (
    <div>
      <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
        {isLoading ? (
          <span className="text-shadow-default">{title}</span>
        ) : (
          <h3 className="overflow-x-auto scrollbar-hidden">
            <CustomLink
              href={`/titles/${id}`}
              text={title}
              className="text-nowrap text-shadow-default"
            />
          </h3>
        )}
      </div>
      <div className="flex flex-col w-full gap-1 p-2 text-xs">
        <div>
          <p className="truncate">
            <span className="font-bold">Popularidade:</span>{' '}
            <span className={isLoading ? 'text-tertiary' : ''}>
              {popularity}º
            </span>
          </p>
        </div>
        <div>
          <p className="truncate">
            <span className="font-bold">Nota:</span>{' '}
            <span className={isLoading ? 'text-tertiary' : ''}>{score}</span>
          </p>
        </div>
        <div>
          <p className="truncate">
            <span className="font-bold">Capítulos:</span>{' '}
            <span className={isLoading ? 'text-tertiary' : ''}>
              {lastChapter}
            </span>
          </p>
        </div>
        <div>
          <p className="truncate">
            <span className="font-bold">Autor:</span>{' '}
            <span className={isLoading ? 'text-tertiary' : ''}>{author}</span>
          </p>
        </div>
        <div>
          <p className="truncate">
            <span className="font-bold">Artista:</span>{' '}
            <span className={isLoading ? 'text-tertiary' : ''}>{artist}</span>
          </p>
        </div>
        <div>
          <p className="truncate">
            <span className="font-bold">Editora:</span>{' '}
            <span className={isLoading ? 'text-tertiary' : ''}>
              {publisher}
            </span>
          </p>
        </div>
        {!disableType && type && (
          <div>
            <p className="truncate">
              <span className="font-bold">Tipo:</span>{' '}
              <span className={isLoading ? 'text-tertiary' : ''}>{type}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TitleDetails;
