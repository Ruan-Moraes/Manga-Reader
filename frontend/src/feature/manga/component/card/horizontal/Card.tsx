import { useMemo } from 'react';

import { ERROR_MESSAGES } from '@shared/constant/API_CONSTANTS';
import { COLORS } from '@shared/constant/COLORS';

import { HorizontalCard } from '../../../type/card.types';

import Warning from '@shared/component/notification/Warning';
import CustomLink from '@shared/component/link/element/CustomLink';
import { getRatingsAverage, RatingStars } from '@feature/rating';

const Card = ({
    isError,
    isLoading,

    id,
    type,
    cover,
    name,
    chapters,
}: HorizontalCard) => {
    const average = useMemo(() => getRatingsAverage(String(id)), [id]);

    const lastChapter = useMemo(() => {
        if (!chapters || chapters.length === 0) {
            return '...';
        }

        return chapters?.[chapters.length - 1];
    }, [chapters]);

    if (isError) {
        return (
            <Warning
                color={COLORS.QUINARY}
                title="Ops! Algo deu errado."
                message={ERROR_MESSAGES.FETCH_ERROR_BASE}
            />
        );
    }

    return (
        <div className="flex flex-col items-start flex-shrink-0">
            <div className="flex flex-col px-3 py-1 text-center rounded-b-none rounded-xs bg-tertiary">
                <span className="font-bold">{isLoading ? '...' : type}</span>
                <span className="text-xs">
                    ({lastChapter === '...' ? lastChapter : lastChapter.number}{' '}
                    Capítulos)
                </span>
            </div>
            <div className="border border-b-0 border-tertiary w-[20rem] h-[18rem] relative rounded-tr-xs overflow-hidden">
                {isLoading && (
                    <span className="flex items-center justify-center h-full font-bold text-tertiary">
                        Carregando...
                    </span>
                )}
                {!isLoading && (
                    <>
                        <div className="absolute right-2 bottom-2 z-10 px-2 py-1 rounded-xs bg-secondary/80 backdrop-blur-sm">
                            <RatingStars value={average} size={12} showValue />
                        </div>
                        <CustomLink
                            link={`/title/${id}`}
                            className="block h-full"
                        >
                            <img
                                alt={`Capa do título: ${name}`}
                                className="object-cover w-full h-full"
                                src={cover}
                            />
                        </CustomLink>
                    </>
                )}
            </div>
            <div className="w-[20rem] px-2 py-1 rounded-b-xs bg-tertiary">
                {isLoading ? (
                    <span className="block font-bold text-center text-shadow-default">
                        ...
                    </span>
                ) : (
                    <h3 className="overflow-x-auto text-center text-nowrap">
                        <CustomLink
                            link={`/title/${id}`}
                            text={name}
                            className="text-shadow-default"
                        />
                    </h3>
                )}
            </div>
        </div>
    );
};

export default Card;
