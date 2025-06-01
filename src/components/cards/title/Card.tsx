import { COLORS } from '../../../constants/COLORS';

import { TitleTypes } from '../../../types/TitleTypes';
import { StatusFetchTypes } from '../../../types/StatusFetchTypes';

import Warning from '../../notifications/Warning';
import TitleDetails from '../../informations/TitleDetails';
import TitleDescription from '../../informations/TitleDescription';

type CardTypes = Partial<Omit<TitleTypes, 'createdAt' | 'updatedAt'>> &
    StatusFetchTypes;

const Card = ({
    id,
    type = '...',
    cover = 'Carregando...',
    title = '...',
    synopsis = 'Carregando...',
    genres = '...',
    chapters = '...',
    popularity = '...',
    score = '...',
    author = '...',
    artist = '...',
    publisher = '...',
    isLoading,
    isError,
}: CardTypes) => {
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
        <div className="flex gap-2">
            <div className="flex flex-col w-2/4 overflow-hidden border border-b-0 rounded-t-xs border-tertiary">
                {isLoading && (
                    <div className="flex items-center justify-center w-full border-b h-44 mobile-md:h-56 border-b-tertiary">
                        <p className="text-tertiary">{cover}</p>
                    </div>
                )}
                {!isLoading && (
                    <div className="w-full h-44 mobile-md:h-56">
                        <img
                            src={cover}
                            alt={`Capa do título ${title}`}
                            className="object-cover w-full h-full aspect-square"
                        />
                    </div>
                )}
                <TitleDetails
                    {...{
                        id,
                        type,
                        title,
                        popularity,
                        score,
                        chapters,
                        author,
                        artist,
                        publisher,
                        isLoading,
                    }}
                />
            </div>
            <div className="flex flex-col justify-between w-2/4 gap-4 pb-2">
                <TitleDescription
                    {...{
                        genres,
                        synopsis,
                    }}
                />
            </div>
        </div>
    );
};

export default Card;
