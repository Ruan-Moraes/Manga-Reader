import { TitleTypes } from '../../../types/TitleTypes';

import TitleDetails from '../../informations/TitleDetails';
import TitleDescription from '../../informations/TitleDescription';

type CardTypes = Omit<TitleTypes, 'createdAt' | 'updatedAt'>;

const Card = ({
    id,
    type,
    cover,
    name,
    synopsis,
    genres,
    chapters,
    popularity,
    score,
    author,
    artist,
    publisher,
}: CardTypes) => {
    return (
        <div className="flex gap-2">
            <div className="flex flex-col w-2/4 overflow-hidden border border-b-0 rounded-t-xs border-tertiary">
                <div className="w-full h-44 mobile-md:h-56">
                    <img
                        src={cover}
                        alt={`Capa do título: ${name}`}
                        className="object-cover w-full h-full aspect-square text-center leading-8"
                    />
                </div>
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
