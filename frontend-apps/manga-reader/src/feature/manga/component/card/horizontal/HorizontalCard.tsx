import { useTranslation } from 'react-i18next';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';

import type { HorizontalCard as HorizontalCardProps } from '../../../type/title-card.types';

import AppLink from '@shared/component/link/element/AppLink';
import { RatingStars } from '@feature/rating';

const HorizontalCard = ({ isError, isLoading, id, type, cover, ratingAverage, name, chaptersCount }: HorizontalCardProps) => {
    const { t } = useTranslation('manga');

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

    return (
        <div className="flex flex-col items-start flex-shrink-0">
            <div className="flex flex-col px-3 py-1 text-center rounded-b-none rounded-xs bg-tertiary">
                <span className="font-bold">{isLoading ? '...' : type}</span>
                <span className="text-xs">{t('card.chaptersCount', { count: chaptersCount ?? 0 })}</span>
            </div>
            <div className="border border-b-0 border-tertiary w-[20rem] h-[18rem] relative rounded-tr-xs overflow-hidden">
                {isLoading && <span className="flex items-center justify-center h-full font-bold text-tertiary">{t('loading')}</span>}
                {!isLoading && (
                    <>
                        <div className="absolute right-2 bottom-2 z-10 px-2 py-1 rounded-xs bg-secondary/80 backdrop-blur-sm">
                            <RatingStars value={ratingAverage!} size={12} />
                        </div>
                        <AppLink link={`title/${id}`} className="block h-full">
                            <img alt={t('coverAlt', { name })} className="object-cover w-full h-full" src={cover} />
                        </AppLink>
                    </>
                )}
            </div>
            <div className="w-[20rem] px-2 py-1 rounded-b-xs bg-tertiary">
                {isLoading ? (
                    <span className="block font-bold text-center text-shadow-default">...</span>
                ) : (
                    <h3 className="overflow-x-auto text-center text-nowrap">
                        <AppLink link={`title/${id}`} text={name} className="text-shadow-default" />
                    </h3>
                )}
            </div>
        </div>
    );
};

export default HorizontalCard;
