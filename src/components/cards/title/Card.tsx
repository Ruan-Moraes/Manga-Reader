import { TitleTypes } from '../../../types/TitleTypes';
import { StatusFetchTypes } from '../../../types/StatusFetchTypes';

import TitleDetails from '../../informations/TitleDetails';
import TitleDescription from '../../informations/TitleDescription';

type CardTypes = Partial<Omit<TitleTypes, 'createdAt' | 'updatedAt'>> &
    StatusFetchTypes;

const Card = ({
    id,
    type = '...',
    cover = 'Carregando...',
    name = '...',
    synopsis = 'Carregando...',
    genres = '...',
    chapters = '...',
    popularity = '...',
    score = '...',
    author = '...',
    artist = '...',
    publisher = '...',
    isLoading,
}: CardTypes) => {
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
                            alt={`Capa do título: ${name}`}
                            className="object-cover w-full h-full aspect-square text-center leading-8"
                        />
                    </div>
                )}
                <TitleDetails
                    {...{
                        id,
                        type,
                        name,
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
