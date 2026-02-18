import { useMemo } from 'react';

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
    score,
    author,
    artist,
    publisher,
}: TitleDetailsProps) => {
    const isDataLoading = shouldLoadCardData && isLoading;

    // Todo: provavelmente, vou ter que alterar isso para pegar o último capítulo
    const lastChapter = useMemo(() => {
        return chapters ? [chapters?.length - 1] : 'N/A';
    }, [chapters]);

    return (
        <div>
            <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
                {isDataLoading ? (
                    <span className="text-shadow-default">...</span>
                ) : (
                    <h3 className="overflow-x-auto scrollbar-hidden">
                        <AppLink
                            link={`/title/${id}`}
                            text={name}
                            className="text-nowrap text-shadow-default"
                        />
                    </h3>
                )}
            </div>
            <div className="flex flex-col w-full gap-1 p-2 text-xs">
                <div>
                    <p className="truncate">
                        <span className="font-bold">Popularidade: </span>
                        <span className={isDataLoading ? 'text-tertiary' : ''}>
                            {isDataLoading ? '...' : popularity + 'º'}
                        </span>
                    </p>
                </div>
                <div>
                    <p className="truncate">
                        <span className="font-bold">Nota: </span>
                        <span className={isDataLoading ? 'text-tertiary' : ''}>
                            {isDataLoading ? '...' : score}
                        </span>
                    </p>
                </div>
                <div>
                    <p className="truncate">
                        <span className="font-bold">Capítulos: </span>
                        <span className={isDataLoading ? 'text-tertiary' : ''}>
                            {isDataLoading ? '...' : lastChapter}
                        </span>
                    </p>
                </div>
                <div>
                    <p className="truncate">
                        <span className="font-bold">Autor: </span>
                        <span className={isDataLoading ? 'text-tertiary' : ''}>
                            {isDataLoading ? '...' : author || 'N/A'}
                        </span>
                    </p>
                </div>
                <div>
                    <p className="truncate">
                        <span className="font-bold">Artista:</span>{' '}
                        <span className={isDataLoading ? 'text-tertiary' : ''}>
                            {isDataLoading ? '...' : artist || 'N/A'}
                        </span>
                    </p>
                </div>
                <div>
                    <p className="truncate">
                        <span className="font-bold">Editora:</span>{' '}
                        <span className={isDataLoading ? 'text-tertiary' : ''}>
                            {isDataLoading ? '...' : publisher || 'N/A'}
                        </span>
                    </p>
                </div>
                {showType && type && (
                    <div>
                        <p className="truncate">
                            <span className="font-bold">Tipo:</span>{' '}
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
