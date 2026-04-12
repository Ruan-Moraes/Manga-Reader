import { useMemo } from 'react';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { ROUTES } from '@shared/constant/ROUTES';

import useTitlesFetch from '../../../hook/data/useTitlesFetch';

import { SectionHeader } from '@feature/manga';

import SectionTitle from '@shared/component/title/SectionTitle';

import HighlightCard from './HighlightCard';

const HighlightCardsContainer = ({ title, subTitle }: SectionHeader) => {
    const { data, status } = useTitlesFetch(
        QUERY_KEYS.TITLES_ON_THE_RISE,
        0,
        5,
    );

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return data.content.map(
                ({
                    id,
                    type,
                    cover,
                    name,
                    synopsis,
                    genres,
                    chapters,
                    popularity,
                    ratingAverage,
                    author,
                    artist,
                    publisher,
                }) => (
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
                        chapters={chapters}
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
            return Array.from({ length: 5 }).map((_, index) => (
                <HighlightCard isLoading={true} isError={false} key={index} />
            ));
        }

        return <HighlightCard isError={true} isLoading={false} />;
    }, [status, data]);

    return (
        <section className="flex flex-col gap-4">
            <SectionTitle
                title={title}
                subTitle={subTitle}
                subLink={ROUTES.FILTER_ASCENSION}
            />
            <div className="flex flex-col gap-4">{allChildren}</div>
        </section>
    );
};

export default HighlightCardsContainer;
