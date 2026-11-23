import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { VerticalCard as VerticalCardProps } from '../../../model/title-card.types';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import AppLink from '@ui/AppLink';

import { RatingStars } from '@entities/review/@x/manga';
import { Image } from 'lucide-react';

const VerticalCard = ({ isError, isLoading, id, type, cover, name, ratingAverage, latestChapterNumber }: VerticalCardProps) => {
    const { t } = useTranslation('manga');

    const hasChapter = Boolean(latestChapterNumber);

    const [imageError, setImageError] = useState<boolean>(false);

    const handleImageError = () => {
        setImageError(true);
    };

    if (isError) {
        return (
            <div className="w-full flex flex-col items-center gap-2">
                <div className="flex flex-col items-center justify-center gap-2 p-4 text-center border-2 rounded-xs border-quinary-default">
                    <h2 className="text-xl font-bold text-quinary-default">{t('errorTitle')}</h2>
                    <p className="text-xs">{ERROR_MESSAGES.FETCH_ERROR_BASE}</p>
                </div>
            </div>
        );
    }

    const renderLatestChapter = () => (
        <p className="flex items-center justify-between p-1 text-xs py-2">
            <span className="block mobile-md:hidden">{t('card.chapterLabelShort')}</span>
            <span className="mobile-md:block hidden">{t('card.chapterLabelFull')}</span>
            {isLoading ? (
                <span className="font-bold text-tertiary">...</span>
            ) : (
                <span className={`font-bold ${hasChapter ? 'text-shadow-highlight' : 'text-tertiary'}`}>
                    {hasChapter ? <AppLink link={`title/${id}/chapter/${latestChapterNumber}`} text={latestChapterNumber} /> : '-'}
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
                        <span className="font-bold text-tertiary">{t('loading')}</span>
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
                                        <Image size={48} className="text-tertiary" />
                                        <span className="mt-2 text-xs text-center text-tertiary">{t('imageUnavailable')}</span>
                                    </div>
                                </div>
                            )}
                        </AppLink>
                    </div>
                )}
                <div className="border-t border-t-tertiary">
                    <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
                        {isLoading && <span className="text-shadow-default">...</span>}
                        {!isLoading && (
                            <h3 className="overflow-x-auto text-nowrap text-shadow-default scrollbar-hidden">
                                <AppLink link={`title/${id}`} text={name} />
                            </h3>
                        )}
                    </div>
                    <div className="flex flex-col px-2">{renderLatestChapter()}</div>
                </div>
            </div>
        </div>
    );
};

export default VerticalCard;
