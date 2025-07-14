import { useMemo, useState } from 'react';
import { IoImageOutline } from 'react-icons/io5';

import { VerticalCardTypes } from '../../../types/CardTypes';

import { ERROR_MESSAGES } from '../../../constants/API_CONSTANTS';
import { COLORS } from '../../../constants/COLORS';

import treatDate from '../../../services/utils/treatDate';

import Warning from '../../notifications/Warning';
import CustomLink from '../../links/elements/CustomLink';
import { ChapterTypes } from '../../../types/ChapterTypes';

const Card = ({
    isError,
    isLoading,

    id,
    type,
    cover,
    name,
    chapters,
}: VerticalCardTypes) => {
    const listOfChapters = useMemo(() => {
        if (!chapters || chapters.length === 0) {
            return [];
        }

        const sortedChapters = [...chapters].sort((a, b) => {
            const numA = parseFloat(a.number);
            const numB = parseFloat(b.number);

            if (isNaN(numA) && isNaN(numB)) {
                return 0;
            }

            if (isNaN(numA)) {
                return 1;
            }

            if (isNaN(numB)) {
                return -1;
            }

            return numB - numA;
        });

        return sortedChapters.slice(0, 3);
    }, [chapters]);

    const [imageError, setImageError] = useState<boolean>(false);

    const handleImageError = () => {
        setImageError(true);
    };

    if (isError) {
        return (
            <Warning
                color={COLORS.QUINARY}
                title="Ops! Algo deu errado."
                message={ERROR_MESSAGES.FETCH_ERROR_BASE}
            />
        );
    }

    const renderChapterItem = (
        chapter: Partial<ChapterTypes>,
        index: number,
        hasChapters: boolean,
    ) => {
        const hasBorder = hasChapters
            ? index < listOfChapters.length - 1
            : index < 2;

        return (
            <p
                key={hasChapters ? chapter.number : `empty-${index}`}
                className={`flex items-center justify-between p-1 text-xs py-2 ${
                    hasBorder ? 'border-b border-tertiary' : ''
                }`}
            >
                <span className="block mobile-md:hidden">Cap:</span>
                <span className="mobile-md:block hidden">Capítulo:</span>
                <span className="flex items-center gap-2">
                    {hasChapters && index === 0 && (
                        <span className="p-1 text-[0.5rem] rounded-xs bg-tertiary">
                            {
                                // TODO: Utilizar o método treatDate para formatar a data
                                (() => {
                                    const date = new Date(chapter.releaseDate);

                                    const month = (date.getMonth() + 1)
                                        .toString()
                                        .padStart(2, '0');
                                    const day = date
                                        .getDate()
                                        .toString()
                                        .padStart(2, '0');

                                    return `${month}/${day}`;
                                })()
                            }
                        </span>
                    )}
                    {isLoading ? (
                        <span className="font-bold text-tertiary">...</span>
                    ) : (
                        <span
                            className={`font-bold ${hasChapters ? 'text-shadow-highlight' : 'text-tertiary'}`}
                        >
                            {hasChapters ? (
                                <CustomLink
                                    link={`/titles/${id}/${chapter.number}`}
                                    text={chapter.number}
                                />
                            ) : (
                                '-'
                            )}
                        </span>
                    )}
                </span>
            </p>
        );
    };

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
                            Carregando...
                        </span>
                    </div>
                )}
                {!isLoading && (
                    <div>
                        <CustomLink
                            link={`/titles/${id}`}
                            className="block h-full"
                        >
                            {!imageError ? (
                                <img
                                    alt={`Capa do título: ${name}`}
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
                                            Imagem não disponível
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CustomLink>
                    </div>
                )}
                <div className="border-t border-t-tertiary">
                    <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
                        {isLoading && (
                            <span className="text-shadow-default">...</span>
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
                        {listOfChapters.length > 0
                            ? listOfChapters.map((chapter, index) =>
                                  renderChapterItem(chapter, index, true),
                              )
                            : Array.from({ length: 3 }).map((_, index) =>
                                  renderChapterItem({}, index, false),
                              )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Card;
