import { useEffect, useRef, useState } from 'react';

import { COLORS } from '../../../constants/COLORS';

import Warning from '../../notifications/Warning';
import CustomLinkBase from '../../links/elements/CustomLinkBase';

type Status = {
  isError?: boolean;
  isLoading?: boolean;
};

type CardProps = {
  artist?: string;
  author?: string;
  chapters?: string;
  id?: string;
  imageSrc?: string;
  popularity?: string;
  publisher?: string;
  score?: string;
  synopsis?: string;
  title?: string;
  type?: string;
};

const Card = ({
  id,
  type = '...',
  imageSrc = 'Carregando...',
  title = '...',
  popularity = '...',
  score = '...',
  chapters = '...',
  author = '...',
  artist = '...',
  publisher = '...',
  synopsis = 'Carregando...',
  isLoading,
  isError,
}: CardProps & Status) => {
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
        <div className="flex flex-row items-center w-full gap-4">
          <div className="flex flex-col w-2/4 border rounded-sm rounded-tl-none border-tertiary">
            <div className="flex items-center justify-center h-52">
              <span className="font-bold text-center text-tertiary">
                {imageSrc}
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
      <div className="flex flex-row items-center w-full gap-4">
        <div
          className="flex flex-col w-2/4 border rounded-sm rounded-tl-none border-tertiary"
          ref={informationsHTML}
        >
          <div>
            <img
              alt={title}
              className="object-cover max-h-[10rem] w-full aspect-square"
              src={imageSrc}
            />
          </div>
          <div className="border-t border-t-tertiary">
            <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
              <h3 className="truncate text-shadow-default">
                <CustomLinkBase
                  href={`/titles/${id}`}
                  className="text-shadow-default"
                  text={title}
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
                  <span>{chapters}</span>
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
            className="text-xs text-justify"
            ref={synopsisHTML}
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: lines,
            }}
          >
            {synopsis}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Card;
