import { useState } from 'react';
import { IoImageOutline } from 'react-icons/io5';

import { BaseCardTypes } from '../../../types/CardTypes';

import TitleDetails from '../../informations/TitleDetails';
import TitleDescription from '../../informations/TitleDescription';

const Card = ({
    showType,
    shouldLoadCardData,
    isLoading,

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
}: BaseCardTypes) => {
    const [imageError, setImageError] = useState<boolean>(false);

    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <div className="flex gap-2">
            <div className="flex flex-col w-2/4 overflow-hidden border border-b-0 rounded-t-xs border-tertiary">
                <div className="w-full h-44 mobile-md:h-56">
                    {!imageError ? (
                        <img
                            src={cover}
                            alt={`Capa do título: ${name}`}
                            onError={handleImageError}
                            className="object-cover w-full h-full aspect-square text-center leading-8"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full bg-secondary">
                            <div className="flex flex-col items-center justify-center">
                                <IoImageOutline
                                    size={48}
                                    className="text-tertiary"
                                />
                                <span className="mt-2 text-xs text-center text-tertiary">
                                    Imagem não disponível
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <TitleDetails
                    showType={showType}
                    shouldLoadCardData={shouldLoadCardData}
                    isLoading={isLoading}
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
