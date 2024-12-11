import { COLORS } from '../../../constants/COLORS';

import Warning from '../../notifications/Warning';
import CustomLinkBase from '../../links/elements/CustomLinkBase';

type Status = {
  isLoading?: boolean;
  isError?: boolean;
};

type CardProps = {
  id?: string;
  type?: string;
  chapters?: string;
  imageSrc?: string;
  title?: string;
};

const Card = ({
  id,
  type = '...',
  chapters = '...',
  imageSrc = 'Carregando...',
  title = '...',
  isLoading,
  isError,
}: CardProps & Status) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-start flex-shrink-0">
        <div className="flex flex-col px-3 py-1 text-center rounded-sm rounded-b-none bg-tertiary">
          <span className="font-bold">{type}</span>
          <span className="text-xs">({chapters} Capítulos)</span>
        </div>
        <div className="flex justify-center items-center border border-b-0 border-tertiary w-[20rem] h-[14rem] relative">
          <span className="p-4 font-bold text-center text-tertiary">
            {imageSrc}
          </span>
        </div>
        <div className="w-[20rem] px-2 py-1 rounded-b-sm bg-tertiary">
          <span className="block font-bold text-center truncate text-shadow-default">
            {title}
          </span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Warning
        title="Erro!"
        message="Ocorreu um erro ao carregar os dados. Tente novamente mais tarde."
        color={COLORS.QUINARY}
      />
    );
  }

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
          className="object-cover w-full h-full"
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
