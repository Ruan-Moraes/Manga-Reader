import { useMemo } from 'react';

import { API_URLS, QUERY_KEYS, ROUTES } from '@shared/constant/API_CONSTANTS';

import { CardsContainer } from '../../../type/card-container.types';

import useTitlesFetch from '../../../hook/data/useTitlesFetch';

import SectionTitle from '@shared/component/title/SectionTitle';
import Card from './Card';

const CardsContainer = ({ title, subTitle }: CardsContainer) => {
    const { data: titles, status } = useTitlesFetch(
        API_URLS.TITLE_URL,
        QUERY_KEYS.TITLES_ON_THE_RISE,
    );

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return Object.values(titles).map(
                ({
                    id,
                    type,
                    cover,
                    name,
                    synopsis,
                    genres,
                    chapters,
                    popularity,
                    score,
                    author,
                    artist,
                    publisher,
                }) => (
                    <Card
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
                        score={score}
                        author={author}
                        artist={artist}
                        publisher={publisher}
                    />
                ),
            );
        }

        if (status === 'pending') {
            return Array.from({ length: 5 }).map((_, index) => (
                <Card isLoading={true} isError={false} key={index} />
            ));
        }

        return <Card isError={true} isLoading={false} />;
    }, [status, titles]);

    return (
        <section className="flex flex-col gap-4">
            <SectionTitle
                title={title}
                subTitle={subTitle}
                subLink={ROUTES.CATEGORIES_ASCENSION}
            />
            <div className="flex flex-col gap-4">{allChildren}</div>
        </section>
    );
};

export default CardsContainer;
