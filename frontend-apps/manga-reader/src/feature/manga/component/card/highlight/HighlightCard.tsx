import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoImageOutline } from 'react-icons/io5';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import { THEME_COLORS } from '@shared/constant/THEME_COLORS';

import type { HighlightCard as HighlightCardProps } from '../../../type/title-card.types';

import AlertBanner from '@shared/component/notification/AlertBanner';
import TitleDetails from '../../information/TitleDetails';
import AppLink from '@shared/component/link/element/AppLink';

import { RatingStars } from '@feature/rating';

const HighlightCard = ({
    isError,
    isLoading,
    id,
    type,
    cover,
    name,
    synopsis,
    chapters,
    popularity,
    ratingAverage,
    author,
    artist,
    publisher,
}: HighlightCardProps) => {
    const { t } = useTranslation('manga');

    const detailsHTML = useRef<HTMLDivElement>(null);
    const synopsisHTML = useRef<HTMLDivElement>(null);

    const [lines, setLines] = useState<number>(0);

    useEffect(() => {
        if (detailsHTML.current && synopsisHTML.current) {
            const descriptionElementHeight =
                (detailsHTML.current.clientHeight * 2) / 3;

            synopsisHTML.current.style.height = `${descriptionElementHeight / 16}rem`;

            const paragraphHeight = synopsisHTML.current.clientHeight;
            const lineHeight = parseFloat(
                getComputedStyle(synopsisHTML.current).lineHeight,
            );

            const totalLines = Math.ceil(paragraphHeight / lineHeight);

            setLines(totalLines);
        }
    }, []);

    const [imageError, setImageError] = useState<boolean>(false);

    const handleImageError = () => {
        setImageError(true);
    };

    if (isError) {
        return (
            <AlertBanner
                color={THEME_COLORS.QUINARY}
                title={t('errorTitle')}
                message={ERROR_MESSAGES.FETCH_ERROR_BASE}
            />
        );
    }

    return (
        <div className="flex flex-col items-start">
            <div className="px-3 py-1 rounded-xs rounded-b-none bg-tertiary">
                <span className="font-bold">{isLoading ? '...' : type}</span>
            </div>
            <div className="flex flex-row items-center w-full gap-2">
                {isLoading && (
                    <div className="flex flex-col w-2/4 border rounded-xs rounded-tl-none border-tertiary">
                        <div className="flex items-center justify-center h-44 mobile-md:h-56">
                            <span className="font-bold text-center text-tertiary">
                                {t('loading')}
                            </span>
                        </div>
                        <TitleDetails
                            showType={false}
                            shouldLoadCardData={true}
                            isLoading={isLoading}
                            {...{
                                id,
                                name,
                                popularity,
                                ratingAverage,
                                chapters,
                                author,
                                artist,
                                publisher,
                            }}
                        />
                    </div>
                )}
                {!isLoading && (
                    <div
                        ref={detailsHTML}
                        className="flex flex-col w-2/4 overflow-hidden border rounded-xs rounded-tl-none border-tertiary"
                    >
                        <div className="relative h-44 mobile-md:h-56">
                            <div className="absolute right-2 bottom-2 z-10 px-1.5 py-1 rounded-xs bg-secondary/80 backdrop-blur-sm">
                                <RatingStars value={ratingAverage!} size={12} />
                            </div>
                            <AppLink link={`title/${id}`} className="h-full">
                                {!imageError ? (
                                    <img
                                        alt={t('coverAlt', { name })}
                                        src={cover}
                                        onError={handleImageError}
                                        className="object-cover w-full h-full aspect-square"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-secondary">
                                        <div className="flex flex-col items-center justify-center">
                                            <IoImageOutline
                                                size={48}
                                                className="text-tertiary"
                                            />
                                            <span className="mt-2 text-xs text-center text-tertiary">
                                                {t('imageUnavailable')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </AppLink>
                        </div>
                        <TitleDetails
                            showType={false}
                            shouldLoadCardData={false}
                            isLoading={isLoading}
                            {...{
                                id,
                                name,
                                popularity,
                                ratingAverage,
                                chapters,
                                author,
                                artist,
                                publisher,
                            }}
                        />
                    </div>
                )}
                <div className="w-2/4 overflow-hidden">
                    {isLoading && (
                        <div className="text-center text-tertiary">
                            {t('synopsisLoading')}
                        </div>
                    )}
                    {!isLoading && (
                        <p
                            ref={synopsisHTML}
                            style={{
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: lines,
                            }}
                            className="text-xs text-justify"
                        >
                            {synopsis}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HighlightCard;
