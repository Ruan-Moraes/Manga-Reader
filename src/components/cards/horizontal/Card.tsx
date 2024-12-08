import CustomLinkBase from '../../links/elements/CustomLinkBase';

interface ICard {
  id: string;
  type: string;
  chapters: string;
  imageSrc: string;
  title: string;
  objectFit?: string;
}

const Card = ({ id, type, chapters, imageSrc, title, objectFit }: ICard) => {
  return (
    <div className="flex flex-col items-start flex-shrink-0">
      <div className="flex flex-col px-3 py-1 text-center rounded-sm rounded-b-none bg-tertiary">
        <span className="font-bold">{type}</span>
        <span className="text-xs">({chapters} Capítulos)</span>
      </div>
      <div className="border border-b-0 border-tertiary w-[20rem] h-[14rem] relative">
        <img
          src={imageSrc}
          alt={title}
          className={`${
            objectFit ? 'object-' + objectFit : 'object-fill'
          } w-full h-full`}
        />
      </div>
      <div className="w-[20rem] px-2 py-1 rounded-b-sm bg-tertiary">
        <h3 className="font-bold text-center truncate text-shadow-default">
          <CustomLinkBase href={`/title/${id}`} text={title} />
        </h3>
      </div>
    </div>
  );
};

export default Card;
