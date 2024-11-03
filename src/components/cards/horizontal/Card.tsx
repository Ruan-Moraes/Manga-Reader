const Card = ({
  type,
  chapters,
  imageSrc,
  title,
}: {
  type: string;
  chapters: string;
  imageSrc: string;
  title: string;
}) => {
  return (
    <div className="flex flex-col items-start flex-shrink-0">
      <div className="flex flex-col px-3 py-1 text-center rounded-sm rounded-b-none bg-tertiary">
        <span className="font-bold">{type}</span>
        <span className="text-xs">({chapters} Capítulos)</span>
      </div>
      <div className="border border-b-0 border-tertiary w-[20rem] h-[16rem]">
        <img src={imageSrc} alt={title} className="w-full h-full object-fit " />
      </div>
      <div className="w-[20rem] px-2 py-1 rounded-b-sm bg-tertiary">
        <h3 className="font-bold text-center truncate">{title}</h3>
      </div>
    </div>
  );
};

export default Card;
