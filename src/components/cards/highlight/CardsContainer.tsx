import { useMemo } from 'react';

import { API_URLS, QUERY_KEYS, ROUTES } from '../../../constants/API_CONSTANTS';

import { CardsContainerTypes } from '../../../types/CardContainerTypes';

import useTitlesFetch from '../../../hooks/titles/data/useTitlesFetch';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';

const CardsContainer = ({ title, subTitle }: CardsContainerTypes) => {
    const { data, status } = useTitlesFetch(
        API_URLS.TITLE_URL,
        QUERY_KEYS.TITLES_ON_THE_RISE,
    );

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return Object.values(data).map(
                ({
                    id,
                    type,
                    cover,
                    title,
                    synopsis,
                    chapters,
                    popularity,
                    score,
                    author,
                    artist,
                    publisher,
                }) => (
                    <Card
                        key={id}
                        id={id}
                        type={type}
                        cover={cover}
                        name={title}
                        synopsis={synopsis}
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
                <Card isLoading={true} key={index} />
            ));
        }

        return <Card isError={true} />;
    }, [data, status]);

    return (
        <section className="flex flex-col gap-4">
            <Section_Title
                title={title}
                subTitle={subTitle}
                subLink={ROUTES.CATEGORIES_ASCENSION}
            />
            <div className="flex flex-col gap-4">{allChildren}</div>
        </section>
    );
};

export default CardsContainer;
