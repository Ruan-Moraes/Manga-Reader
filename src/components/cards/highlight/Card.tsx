import { useEffect, useRef, useState } from 'react';

const Card = ({
  type,
  imageSrc,
  title,
  popularity,
  score,
  chapters,
  author,
  artist,
  publisher,
  synopsis,
}: {
  type: string;
  imageSrc: string;
  title: string;
  popularity: string;
  score: string;
  chapters: string;
  author: string;
  artist: string;
  publisher: string;
  synopsis: string;
}) => {
  const informationsHTML = useRef<HTMLDivElement>(null);
  const synopsisHTML = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<number>(0);

  useEffect(() => {
    if (informationsHTML.current && synopsisHTML.current) {
      const informationsHTMLHeight = informationsHTML.current.clientHeight;

      if (informationsHTMLHeight > 226) {
        synopsisHTML.current.style.height = '14.125rem';
      }

      const paragraphHeight = synopsisHTML.current.clientHeight;
      const lineHeight = parseFloat(
        getComputedStyle(synopsisHTML.current).lineHeight
      );

      const totalLines = Math.ceil(paragraphHeight / lineHeight) - 1;
      setLines(totalLines);
    }
  }, []);

  return (
    <div className="flex flex-col items-start">
      <div className="px-3 py-1 rounded-sm rounded-b-none bg-tertiary">
        <span>{type}</span>
      </div>
      <div className="flex flex-row items-center w-full gap-4">
        <div
          ref={informationsHTML}
          className="flex flex-col w-2/4 border rounded-sm rounded-tl-none border-tertiary"
        >
          <div>
            <img
              src={imageSrc}
              alt={title}
              className="object-cover max-h-[8rem] w-full"
            />
          </div>
          <div className="border-t border-t-tertiary">
            <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
              <h3 className="truncate">{title}</h3>
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
            ref={synopsisHTML}
            className="text-xs text-justify"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: lines > 0 ? lines : undefined,
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
