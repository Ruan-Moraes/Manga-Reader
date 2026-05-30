import { useMemo } from 'react';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { ROUTES } from '@shared/constant/ROUTES';

import useTitlesFetch from '../../../hook/data/useTitlesFetch';

import { SectionHeader } from '@entities/manga';

import AppLink from '@shared/component/link/element/AppLink';

import HighlightCard from './HighlightCard';

const HighlightCardsContainer = ({ title, subTitle }: SectionHeader) => {
    const { data, status } = useTitlesFetch(QUERY_KEYS.TITLES_ON_THE_RISE, 0, 5);

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return data.content.map(
                ({ id, type, cover, name, synopsis, genres, latestChapterNumber, popularity, ratingAverage, author, artist, publisher }) => (
                    <HighlightCard
                        isLoading={false}
                        isError={false}
                        key={id}
                        id={id}
                        type={type}
                        cover={cover}
                        name={name}
                        synopsis={synopsis}
                        genres={genres}
                        latestChapterNumber={latestChapterNumber}
                        popularity={popularity}
                        ratingAverage={ratingAverage}
                        author={author}
                        artist={artist}
                        publisher={publisher}
                    />
                ),
            );
        }

        if (status === 'pending') {
            return Array.from({ length: 5 }).map((_, index) => <HighlightCard isLoading={true} isError={false} key={index} />);
        }

        return <HighlightCard isError={true} isLoading={false} />;
    }, [status, data]);

    return (
        <section className="flex flex-col gap-4">
            <div>
                <h2 className="font-bold text-2xl">{title}</h2>
                {subTitle && (
                    <p className="leading-none">
                        <AppLink link={ROUTES.FILTER_ASCENSION} text={subTitle} className="text-xs text-quaternary-default" />
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-4">{allChildren}</div>
        </section>
    );
};

export default HighlightCardsContainer;
