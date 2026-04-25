import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { TitleDetails as TitleDetailsProps } from '../../type/title-card.types';

import AppLink from '@shared/component/link/element/AppLink';

const TitleDetails = ({
    showType,
    shouldLoadCardData,
    isLoading,
    id,
    name,
    type,
    chapters,
    popularity,
    author,
    artist,
    publisher,
}: TitleDetailsProps) => {
    const { t } = useTranslation('manga');

    const isDataLoading = shouldLoadCardData && isLoading;

    const lastChapter = useMemo(() => {
        return chapters ? [chapters?.length - 1] : t('details.notAvailable');
    }, [chapters, t]);

    return (
        <div>
            <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
                {isDataLoading ? (
                    <span className="text-shadow-default">...</span>
                ) : (
                    <h3 className="overflow-x-auto scrollbar-hidden">
                        <AppLink
                            link={`title/${id}`}
                            text={name}
                            className="text-nowrap text-shadow-default"
                        />
                    </h3>
                )}
            </div>
            <div className="flex flex-col w-full gap-1 p-2 text-xs">
                <div>
                    <p className="truncate">
                        <span className="font-bold">
                            {t('details.popularity')}{' '}
                        </span>
                        <span className={isDataLoading ? 'text-tertiary' : ''}>
                            {isDataLoading ? '...' : popularity + 'º'}
                        </span>
                    </p>
                </div>
                <div>
                    <p className="truncate">
                        <span className="font-bold">
                            {t('details.chapters')}{' '}
                        </span>
                        <span className={isDataLoading ? 'text-tertiary' : ''}>
                            {isDataLoading ? '...' : lastChapter}
                        </span>
                    </p>
                </div>
                <div>
                    <p className="truncate">
                        <span className="font-bold">
                            {t('details.author')}{' '}
                        </span>
                        <span className={isDataLoading ? 'text-tertiary' : ''}>
                            {isDataLoading
                                ? '...'
                                : author || t('details.notAvailable')}
                        </span>
                    </p>
                </div>
                <div>
                    <p className="truncate">
                        <span className="font-bold">
                            {t('details.artist')}
                        </span>{' '}
                        <span className={isDataLoading ? 'text-tertiary' : ''}>
                            {isDataLoading
                                ? '...'
                                : artist || t('details.notAvailable')}
                        </span>
                    </p>
                </div>
                <div>
                    <p className="truncate">
                        <span className="font-bold">
                            {t('details.publisher')}
                        </span>{' '}
                        <span className={isDataLoading ? 'text-tertiary' : ''}>
                            {isDataLoading
                                ? '...'
                                : publisher || t('details.notAvailable')}
                        </span>
                    </p>
                </div>
                {showType && type && (
                    <div>
                        <p className="truncate">
                            <span className="font-bold">
                                {t('details.type')}
                            </span>{' '}
                            <span
                                className={isDataLoading ? 'text-tertiary' : ''}
                            >
                                {isDataLoading ? '...' : type}
                            </span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TitleDetails;
