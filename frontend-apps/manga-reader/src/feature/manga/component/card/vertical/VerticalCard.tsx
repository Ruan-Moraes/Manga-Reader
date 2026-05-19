import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoImageOutline } from 'react-icons/io5';

import type { VerticalCard as VerticalCardProps } from '../../../type/title-card.types';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import { THEME_COLORS } from '@shared/constant/THEME_COLORS';
import AlertBanner from '@shared/component/notification/AlertBanner';
import AppLink from '@shared/component/link/element/AppLink';

import { RatingStars } from '@feature/rating';

const VerticalCard = ({
    isError,
    isLoading,
    id,
    type,
    cover,
    name,
    ratingAverage,
    latestChapterNumber,
}: VerticalCardProps) => {
    const { t } = useTranslation('manga');

    const hasChapter = Boolean(latestChapterNumber);

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

    const renderLatestChapter = () => (
        <p className="flex items-center justify-between p-1 text-xs py-2">
            <span className="block mobile-md:hidden">
                {t('card.chapterLabelShort')}
            </span>
            <span className="mobile-md:block hidden">
                {t('card.chapterLabelFull')}
            </span>
            {isLoading ? (
                <span className="font-bold text-tertiary">...</span>
            ) : (
                <span
                    className={`font-bold ${hasChapter ? 'text-shadow-highlight' : 'text-tertiary'}`}
                >
                    {hasChapter ? (
                        <AppLink
                            link={`title/${id}/chapter/${latestChapterNumber}`}
                            text={latestChapterNumber}
                        />
                    ) : (
                        '-'
                    )}
                </span>
            )}
        </p>
    );

    return (
        <div className="flex flex-col items-start">
            <div className="px-3 py-1 rounded-xs rounded-b-none bg-tertiary">
                {isLoading && <span className="font-bold">...</span>}
                {!isLoading && <span className="font-bold">{type}</span>}
            </div>
            <div className="flex flex-col w-full border rounded-xs rounded-tl-none border-tertiary">
                {isLoading && (
                    <div className="flex items-center justify-center h-44 mobile-md:h-56">
                        <span className="font-bold text-tertiary">
                            {t('loading')}
                        </span>
                    </div>
                )}
                {!isLoading && (
                    <div className="relative">
                        <div className="absolute right-2 bottom-2 z-10 px-1.5 py-1 rounded-xs bg-secondary/80 backdrop-blur-sm">
                            <RatingStars value={ratingAverage!} size={12} />
                        </div>
                        <AppLink link={`title/${id}`} className="block h-full">
                            {!imageError ? (
                                <img
                                    alt={t('coverAlt', { name })}
                                    className="object-cover w-full h-44 mobile-md:h-56 spect-square"
                                    src={cover}
                                    onError={handleImageError}
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-44 mobile-md:h-56 bg-secondary">
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
                )}
                <div className="border-t border-t-tertiary">
                    <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
                        {isLoading && (
                            <span className="text-shadow-default">...</span>
                        )}
                        {!isLoading && (
                            <h3 className="overflow-x-auto text-nowrap text-shadow-default scrollbar-hidden">
                                <AppLink link={`title/${id}`} text={name} />
                            </h3>
                        )}
                    </div>
                    <div className="flex flex-col px-2">
                        {renderLatestChapter()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerticalCard;
