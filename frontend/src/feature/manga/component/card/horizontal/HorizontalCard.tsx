import { useMemo } from 'react';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import { THEME_COLORS } from '@shared/constant/THEME_COLORS';

import type { HorizontalCard as HorizontalCardProps } from '../../../type/title-card.types';

import AlertBanner from '@shared/component/notification/AlertBanner';
import AppLink from '@shared/component/link/element/AppLink';
import { getRatingsAverage, RatingStars } from '@feature/rating';

const HorizontalCard = ({
    isError,
    isLoading,

    id,
    type,
    cover,
    name,
    chapters,
}: HorizontalCardProps) => {
    const average = useMemo(() => getRatingsAverage(String(id)), [id]);

    const lastChapter = useMemo(() => {
        if (!chapters || chapters.length === 0) {
            return '...';
        }

        return chapters?.[chapters.length - 1];
    }, [chapters]);

    if (isError) {
        return (
            <AlertBanner
                color={THEME_COLORS.QUINARY}
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
                        <AppLink link={`/title/${id}`} className="block h-full">
                            <img
                                alt={`Capa do título: ${name}`}
                                className="object-cover w-full h-full"
                                src={cover}
                            />
                        </AppLink>
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
                        <AppLink
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

export default HorizontalCard;
