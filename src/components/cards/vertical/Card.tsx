import { useMemo } from 'react';

import { COLORS } from '../../../constants/COLORS';

import Warning from '../../notifications/Warning';
import CustomLinkBase from '../../links/elements/CustomLinkBase';

type Status = {
  isError?: boolean;
  isLoading?: boolean;
};

type CardProps = {
  chapters?: string;
  id?: string;
  imageSrc?: string;
  releaseDate?: string;
  title?: string;
  type?: string;
};

const Card = ({
  id,
  type = '...',
  imageSrc = 'Carregando...',
  title = '...',
  chapters = '...',
  releaseDate = '...',
  isLoading,
  isError,
}: CardProps & Status) => {
  const howManyChapters = useMemo(() => 3, []);
  const lastThreeChapters = useMemo(
    () => chapters?.split('/')?.slice(-howManyChapters) ?? [],
    [chapters, howManyChapters]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-start">
        <div className="px-3 py-1 rounded-sm rounded-b-none bg-tertiary">
          <span className="font-bold">{type}</span>
        </div>
        <div className="flex flex-col w-full border rounded-sm rounded-tl-none border-tertiary">
          <div className="flex items-center justify-center h-[11.625rem]">
            <span className="font-bold text-tertiary">{imageSrc}</span>
          </div>
          <div className="border-t border-t-tertiary">
            <div className="px-2 py-0.5 text-sm font-bold text-center bg-tertiary">
              <span className="text-shadow-default">{title}</span>
            </div>
            <div className="flex flex-col px-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <p
                  className={`flex items-center justify-between p-1 text-xs py-2 ${
                    index < 2 ? 'border-b border-tertiary' : ''
                  }`}
                  key={index}
                >
                  <span>Capítulo:</span>
                  <span className="flex items-center gap-2">
                    {index === 0 ? (
                      <span className="p-0.5 px-1 text-[0.5rem] rounded-sm bg-tertiary">
                        {releaseDate}
                      </span>
                    ) : (
                      ''
                    )}
                    <span className="font-bold text-tertiary">
                      <span>{chapters}</span>
                    </span>
                  </span>
                </p>
              ))}
            </div>
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
      <div className="flex flex-col w-full border rounded-sm rounded-tl-none border-tertiary">
        <div>
          <img
            alt={title}
            className="spect-square h-[11.625rem] w-full object-cover"
            loading="lazy"
            src={imageSrc}
          />
        </div>
        <div className="border-t border-t-tertiary">
          <div className="px-2 py-0.5 text-sm font-bold text-center bg-tertiary">
            <h3 className="truncate text-shadow-default">
              <CustomLinkBase href={`/titles/${id}`} text={title} />
            </h3>
          </div>
          <div className="flex flex-col px-2">
            {lastThreeChapters.map((chapter, index) => (
              <p
                className={`flex items-center justify-between p-1 text-xs py-2 ${
                  index < lastThreeChapters.length - 1
                    ? 'border-b border-tertiary'
                    : ''
                }`}
                key={index}
              >
                <span className="mobile-md:hidden">Cap:</span>
                <span className="hidden mobile-md:block">Capítulo:</span>
                <span className="flex items-center gap-2">
                  {index === 0 ? (
                    <span className="p-0.5 px-1 text-[0.5rem] rounded-sm bg-tertiary">
                      {releaseDate}
                    </span>
                  ) : (
                    ''
                  )}
                  <span className="font-bold text-shadow-highlight">
                    <CustomLinkBase
                      href={`/titles/${id}/${chapter}`}
                      text={chapter}
                    />
                  </span>
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
