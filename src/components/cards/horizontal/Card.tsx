import { useMemo } from 'react';

import { ERROR_MESSAGES } from '../../../constants/API_CONSTANTS';
import { COLORS } from '../../../constants/COLORS';

import { HorizontalCardTypes } from '../../../types/CardTypes';

import Warning from '../../notifications/Warning';
import CustomLink from '../../links/elements/CustomLink';

const Card = ({
    isError,
    isLoading,

    id,
    type,
    cover,
    name,
    chapters,
}: HorizontalCardTypes) => {
    // TODO: Alterar quando a API estiver finalizada.
    const lastChapter = useMemo(() => {
        if (!chapters || chapters.length === 0) {
            return '...';
        }

        return chapters?.[chapters.length - 1];
    }, [chapters]);

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
        <div className="flex flex-col items-start flex-shrink-0">
            <div className="flex flex-col px-3 py-1 text-center rounded-b-none rounded-xs bg-tertiary">
                <span className="font-bold">{isLoading ? '...' : type}</span>
                <span className="text-xs">
                    <span>
                        (
                        {lastChapter === '...'
                            ? lastChapter
                            : lastChapter.number}{' '}
                        Capítulos)
                    </span>
                </span>
            </div>
            <div className="border border-b-0 border-tertiary w-[20rem] h-[18rem] relative rounded-tr-xs overflow-hidden">
                {isLoading && (
                    <span className="flex items-center justify-center h-full font-bold text-tertiary">
                        Carregando...
                    </span>
                )}
                {!isLoading && (
                    <CustomLink link={`/titles/${id}`} className="block h-full">
                        <img
                            alt={`Capa do título: ${name}`}
                            className="object-cover w-full h-full"
                            src={cover}
                        />
                    </CustomLink>
                )}
            </div>
            <div className="w-[20rem] px-2 py-1 rounded-b-xs bg-tertiary">
                {isLoading && (
                    <span className="block font-bold text-center text-shadow-default">
                        ...
                    </span>
                )}
                {!isLoading && (
                    <h3 className="overflow-x-auto text-center text-nowrap">
                        <CustomLink
                            link={`/titles/${id}`}
                            text={name}
                            className="text-shadow-default"
                        />
                    </h3>
                )}
            </div>
        </div>
    );
};

export default Card;
