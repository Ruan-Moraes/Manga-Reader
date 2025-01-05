import { useMemo, useRef, useState, useEffect } from 'react';

import { TitleTypes } from '../../../types/TitleTypes';
import { StatusFetchTypes } from '../../../types/StatusFetchTypes';

import { COLORS } from '../../../constants/COLORS';

import Warning from '../../notifications/Warning';
import CustomLinkBase from '../../links/elements/CustomLinkBase';

type CardProps = Partial<Omit<TitleTypes, 'createdAt' | 'updatedAt'>> &
  StatusFetchTypes;

const Card = ({
  id,
  type = '...',
  cover = 'Carregando...',
  title = '...',
  synopsis = 'Carregando...',
  chapters = '...',
  popularity = '...',
  score = '...',
  author = '...',
  artist = '...',
  publisher = '...',
  isLoading,
  isError,
}: CardProps) => {
  const lastChapter = useMemo(
    () => chapters?.split('/')?.slice(-1)[0],
    [chapters]
  );

  const informationsHTML = useRef<HTMLDivElement>(null);
  const synopsisHTML = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<number>(0);

  useEffect(() => {
    if (informationsHTML.current && synopsisHTML.current) {
      const informationsHTMLHeight = informationsHTML.current.clientHeight;

      if (informationsHTMLHeight > 226) {
        synopsisHTML.current.style.height = '14.05rem';
      }

      const paragraphHeight = synopsisHTML.current.clientHeight;
      const lineHeight = parseFloat(
        getComputedStyle(synopsisHTML.current).lineHeight
      );

      const totalLines = Math.ceil(paragraphHeight / lineHeight) - 1;

      setLines(totalLines);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-start">
        <div className="px-3 py-1 rounded-sm rounded-b-none bg-tertiary">
          <span className="font-bold">{type}</span>
        </div>
        <div className="flex flex-row items-center w-full gap-2">
          <div className="flex flex-col w-2/4 border rounded-sm rounded-tl-none border-tertiary">
            <div className="flex items-center justify-center h-52">
              <span className="font-bold text-center text-tertiary">
                {cover}
              </span>
            </div>
            <div className="border-t border-t-tertiary">
              <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
                <span className="truncate text-shadow-default">{title}</span>
              </div>
              <div className="flex flex-col w-full gap-1 p-2 text-xs">
                <div>
                  <span className="truncate">
                    <span className="font-bold">Popularidade:</span>{' '}
                    <span className="text-tertiary">{popularity} º</span>
                  </span>
                </div>
                <div>
                  <span>
                    <span className="font-bold">Nota:</span>{' '}
                    <span className="text-tertiary">{score}</span>
                  </span>
                </div>
                <div>
                  <span>
                    <span className="font-bold">Capítulos:</span>{' '}
                    <span className="text-tertiary">{chapters}</span>
                  </span>
                </div>
                <div>
                  <span className="truncate">
                    <span className="font-bold">Autor:</span>{' '}
                    <span className="text-tertiary">{author}</span>
                  </span>
                </div>
                <div>
                  <span className="truncate">
                    <span className="font-bold">Artista:</span>{' '}
                    <span className="text-tertiary">{artist}</span>
                  </span>
                </div>
                <div>
                  <span className="truncate">
                    <span className="font-bold">Editora:</span>{' '}
                    <span className="text-tertiary">{publisher}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-2/4 overflow-hidden">
            <span className="block text-center text-tertiary">{synopsis}</span>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="flex flex-col items-start">
      <div className="px-3 py-1 rounded-sm rounded-b-none bg-tertiary">
        <span className="font-bold">{type}</span>
      </div>
      <div className="flex flex-row items-center w-full gap-2">
        <div
          ref={informationsHTML}
          className="flex flex-col w-2/4 border rounded-sm rounded-tl-none border-tertiary"
        >
          <div>
            <CustomLinkBase href={`/titles/${id}`} className="block h-full">
              <img
                alt={`Capa do título: ${title}`}
                src={cover}
                className="object-cover max-h-[10rem] w-full aspect-square"
              />
            </CustomLinkBase>
          </div>
          <div className="border-t border-t-tertiary">
            <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
              <h3 className="truncate text-shadow-default">
                <CustomLinkBase
                  href={`/titles/${id}`}
                  text={title}
                  className="text-shadow-default"
                />
              </h3>
            </div>
            <div className="flex flex-col w-full gap-1 p-2 text-xs">
              <div>
                <p className="truncate">
                  <span className="font-bold">Popularidade:</span>{' '}
                  <span>{popularity}º</span>
                </p>
              </div>
              <div>
                <p>
                  <span className="font-bold">Nota:</span> <span>{score}</span>
                </p>
              </div>
              <div>
                <p>
                  <span className="font-bold">Capítulos:</span>{' '}
                  <span>{lastChapter}</span>
                </p>
              </div>
              <div>
                <p className="truncate">
                  <span className="font-bold">Autor:</span>{' '}
                  <span>{author}</span>
                </p>
              </div>
              <div>
                <p className="truncate">
                  <span className="font-bold">Artista:</span>{' '}
                  <span>{artist}</span>
                </p>
              </div>
              <div>
                <p className="truncate">
                  <span className="font-bold">Editora:</span>{' '}
                  <span>{publisher}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-2/4 overflow-hidden">
          <p
            ref={synopsisHTML}
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: lines,
            }}
            className="text-xs text-justify"
          >
            {synopsis}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Card;
