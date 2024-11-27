const howManyChapters = 3;

interface ICard {
  type: string;
  imageSrc: string;
  title: string;
  chapters: string;
  releaseDate: string;
  objectFit?: string;
}

const Card = ({
  type,
  imageSrc,
  title,
  chapters,
  releaseDate,
  objectFit,
}: ICard) => {
  const lastThreeChapters = chapters.split('/').slice(-howManyChapters);

  return (
    <div className="flex flex-col items-start">
      <div className="px-3 py-1 rounded-sm rounded-b-none bg-tertiary">
        <span className="font-bold">{type}</span>
      </div>
      <div className="flex flex-col w-full border rounded-sm rounded-tl-none border-tertiary">
        <div>
          <img
            src={imageSrc}
            alt={title}
            className={`${
              objectFit ? 'object-' + objectFit : 'object-fill'
            } aspect-square`}
          />
        </div>
        <div className="border-t border-t-tertiary">
          <div className="px-2 py-0.5 text-sm font-bold text-center bg-tertiary">
            <h3 className="truncate text-shadow-default">{title}</h3>
          </div>
          <div className="flex flex-col px-2">
            {lastThreeChapters.map((chapter, index) => (
              <p
                key={index}
                className={`flex items-center justify-between p-1 text-xs py-2 ${
                  index < lastThreeChapters.length - 1
                    ? 'border-b border-tertiary'
                    : ''
                }`}
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
                  <span className="font-bold text-shadow-highlight">
                    {chapter}
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
