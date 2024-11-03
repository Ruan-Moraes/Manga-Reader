const Card = ({
  type,
  imageSrc,
  title,
}: {
  type: string;
  imageSrc: string;
  title: string;
}) => {
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
            className="object-fit aspect-square"
          />
        </div>
        <div className="border-t border-t-tertiary">
          <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
            <h3 className="truncate">{title}</h3>
          </div>
          <div className="flex flex-col px-2 text-xs">
            <div className="flex items-center justify-between p-1 py-2 border-b border-tertiary">
              <span className="text-tertiary">Capítulo:</span>
              <span className="flex items-center gap-2">
                <span className="p-0.5 px-1 text-[0.5rem] font-bold rounded-sm bg-tertiary">
                  Novo
                </span>
                <span className="font-bold">23</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-1 py-2 border-b border-tertiary">
              <span className="text-tertiary">Capítulo:</span>
              <span>
                <span className="font-bold">22</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-1 py-2">
              <span className="text-tertiary">Capítulo:</span>
              <span>
                <span className="font-bold">21</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
