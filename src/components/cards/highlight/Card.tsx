import { useEffect, useRef, useState } from 'react';
import { IoImageOutline } from 'react-icons/io5';

import { ERROR_MESSAGES } from '../../../constants/API_CONSTANTS';
import { COLORS } from '../../../constants/COLORS';

import { HighlightCardTypes } from '../../../types/CardTypes';

import Warning from '../../notifications/Warning';
import TitleDetails from '../../informations/TitleDetails';
import CustomLink from '../../links/elements/CustomLink';

const Card = ({
    isError,
    isLoading,

    id,
    type,
    cover,
    name,
    synopsis,
    chapters,
    popularity,
    score,
    author,
    artist,
    publisher,
}: HighlightCardTypes) => {
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
                                Carregando...
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
                                score,
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
                        <div className="h-44 mobile-md:h-56">
                            <CustomLink
                                link={`/titles/${id}`}
                                className="h-full"
                            >
                                {!imageError ? (
                                    <img
                                        alt={`Capa do título: ${name}`}
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
                                                Imagem não disponível
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CustomLink>
                        </div>
                        <TitleDetails
                            showType={false}
                            shouldLoadCardData={false}
                            isLoading={isLoading}
                            {...{
                                id,
                                name,
                                popularity,
                                score,
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
                            Estamos carregando a sinopse...
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
