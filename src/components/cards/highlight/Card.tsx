import { useEffect, useRef, useState } from 'react';

import { ERROR_MESSAGES } from '../../../constants/API_CONSTANTS';
import { COLORS } from '../../../constants/COLORS';

import { TitleTypes } from '../../../types/TitleTypes';
import { StatusFetchTypes } from '../../../types/StatusFetchTypes';

import Warning from '../../notifications/Warning';
import TitleDetails from '../../informations/TitleDetails';
import CustomLink from '../../links/elements/CustomLink';

type CardTypes = Partial<Omit<TitleTypes, 'createdAt' | 'updatedAt'>> &
    StatusFetchTypes;

const Card = ({
    id,
    type = '...',
    cover = 'Carregando...',
    title = '...',
    synopsis = 'Carregando...',
    chapters = '...',
    popularity = '...',
    score = '...',
    author = '...',
    artist = '...',
    publisher = '...',
    isError,
    isLoading,
}: CardTypes) => {
    const detailsHTML = useRef<HTMLDivElement>(null);
    const synopsisHTML = useRef<HTMLDivElement>(null);

    const [lines, setLines] = useState<number>(0);

    useEffect(() => {
        if (detailsHTML.current && synopsisHTML.current) {
            const descriptionElementHeight =
                (detailsHTML.current.clientHeight * 2) / 3; // 2/3 do tamanho do elemento

            synopsisHTML.current.style.height = `${descriptionElementHeight / 16}rem`;

            const paragraphHeight = synopsisHTML.current.clientHeight;
            const lineHeight = parseFloat(
                getComputedStyle(synopsisHTML.current).lineHeight,
            );

            const totalLines = Math.ceil(paragraphHeight / lineHeight);

            setLines(totalLines);
        }
    }, []);

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
            <div className="flex flex-row items-center w-full gap-2">
                {isLoading && (
                    <div className="flex flex-col w-2/4 border rounded-xs rounded-tl-none border-tertiary">
                        <div className="flex items-center justify-center h-44 mobile-md:h-56">
                            <span className="font-bold text-center text-tertiary">
                                {cover}
                            </span>
                        </div>
                        <TitleDetails
                            {...{
                                type,
                                title,
                                popularity,
                                score,
                                chapters,
                                author,
                                artist,
                                publisher,
                                disableType: true,
                                isLoading,
                            }}
                        />
                    </div>
                )}
                {!isLoading && (
                    <div
                        ref={detailsHTML}
                        className="flex flex-col w-2/4 overflow-hidden border rounded-xs rounded-tl-none border-tertiary"
                    >
                        <div className="h-44 mobile-md:h-56">
                            <CustomLink
                                link={`/titles/${id}`}
                                className="h-full"
                            >
                                <img
                                    alt={`Capa do título: ${title}`}
                                    src={cover}
                                    className="object-cover w-full h-full aspect-square"
                                />
                            </CustomLink>
                        </div>
                        <TitleDetails
                            {...{
                                id,
                                title,
                                chapters,
                                popularity,
                                score,
                                author,
                                artist,
                                publisher,
                                disableType: true,
                                isLoading,
                            }}
                        />
                    </div>
                )}
                <div className="w-2/4 overflow-hidden">
                    {isLoading && (
                        <div className="text-center text-tertiary">
                            {synopsis}
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

export default Card;
