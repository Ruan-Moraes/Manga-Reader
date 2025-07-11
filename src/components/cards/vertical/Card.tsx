import { useMemo } from 'react';

import { ERROR_MESSAGES } from '../../../constants/API_CONSTANTS';
import { COLORS } from '../../../constants/COLORS';

import { TitleTypes } from '../../../types/TitleTypes';
import { StatusFetchTypes } from '../../../types/StatusFetchTypes';

import Warning from '../../notifications/Warning';
import CustomLink from '../../links/elements/CustomLink';

type CardTypes = Partial<
    Omit<
        TitleTypes,
        | 'synopsis'
        | 'popularity'
        | 'score'
        | 'author'
        | 'artist'
        | 'publisher'
        | 'createdAt'
    >
> &
    StatusFetchTypes;

const Card = ({
    id,
    type = '...',
    cover = 'Carregando...',
    name = '...',
    chapters = '...',
    updatedAt = '...',
    isLoading,
    isError,
}: CardTypes) => {
    const updatedAtDate = useMemo(() => {
        if (updatedAt === '...') return updatedAt;

        const date = new Date(updatedAt);

        return `${date.getDate().toString().length === 1 ? `0${date.getDate()}` : date.getDate()}/${
            date.getMonth().toString().length === 1
                ? `0${date.getMonth() + 1}`
                : date.getMonth() + 1
        }`;
    }, [updatedAt]);

    const chaptersReverse = [...chapters].reverse();

    if (isError) {
        return (
            <Warning
                color={COLORS.QUINARY}
                message={ERROR_MESSAGES.FETCH_ERROR_BASE}
                title="Erro!"
            />
        );
    }

    return (
        <div className="flex flex-col items-start">
            <div className="px-3 py-1 rounded-xs rounded-b-none bg-tertiary">
                <span className="font-bold">{type}</span>
            </div>
            <div className="flex flex-col w-full border rounded-xs rounded-tl-none border-tertiary">
                {isLoading && (
                    <div className="flex items-center justify-center h-44 mobile-md:h-56">
                        <span className="font-bold text-tertiary">{cover}</span>
                    </div>
                )}
                {!isLoading && (
                    <div>
                        <CustomLink
                            link={`/titles/${id}`}
                            className="block h-full"
                        >
                            <img
                                alt={`Capa do título: ${name}`}
                                className="object-cover w-full h-44 mobile-md:h-56 spect-square"
                                src={cover}
                            />
                        </CustomLink>
                    </div>
                )}
                <div className="border-t border-t-tertiary">
                    <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
                        {isLoading && (
                            <span className="text-shadow-default">{name}</span>
                        )}
                        {!isLoading && (
                            <h3 className="overflow-x-auto text-nowrap text-shadow-default scrollbar-hidden">
                                <CustomLink
                                    link={`/titles/${id}`}
                                    text={name}
                                />
                            </h3>
                        )}
                    </div>
                    <div className="flex flex-col px-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <p
                                className={`flex items-center justify-between p-1 text-xs py-2 ${
                                    index < 2 ? 'border-b border-tertiary' : ''
                                }`}
                                key={index}
                            >
                                <span className="block mobile-md:hidden">
                                    Cap:
                                </span>
                                <span className="mobile-md:block hidden">
                                    Capítulo:
                                </span>
                                <span className="flex items-center gap-2">
                                    {index === 0 ? (
                                        <span className="p-1 text-[0.5rem] rounded-xs bg-tertiary">
                                            {updatedAtDate}
                                        </span>
                                    ) : (
                                        ''
                                    )}
                                    {isLoading ? (
                                        <span className="font-bold text-tertiary">
                                            {chapters}
                                        </span>
                                    ) : (
                                        <span className="font-bold text-shadow-highlight">
                                            <CustomLink
                                                link={`/titles/${id}/${chaptersReverse[index]}`}
                                                text={chaptersReverse[index]}
                                            />
                                        </span>
                                    )}
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
