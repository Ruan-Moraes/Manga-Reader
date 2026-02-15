import { useMemo } from 'react';

import { API_URLS, QUERY_KEYS, ROUTES } from '@shared/constant/API_CONSTANTS';

import useTitlesFetch from '../../../hook/data/useTitlesFetch';

import { CardsContainer } from '../../../type/card-container.types';

import SectionTitle from '@shared/component/title/SectionTitle';
import Card from './Card';

const CardsContainer = ({ title, subTitle }: CardsContainer) => {
    const { data, status } = useTitlesFetch(
        API_URLS.TITLE_URL,
        QUERY_KEYS.RANDOM_TITLES,
    );

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return Object.values(data).map(
                ({ id, type, cover, name, chapters }) => (
                    <Card
                        isLoading={false}
                        isError={false}
                        key={id}
                        id={id}
                        chapters={chapters}
                        cover={cover}
                        name={name}
                        type={type}
                    />
                ),
            );
        }

        if (status === 'pending') {
            return Array.from({ length: 10 }).map((_, index) => (
                <Card isLoading={true} isError={false} key={index} />
            ));
        }

        return <Card isError={true} isLoading={false} />;
    }, [data, status]);

    return (
        <section className="flex flex-col gap-4">
            <SectionTitle
                title={title}
                subTitle={subTitle}
                subLink={ROUTES.CATEGORIES_RANDOM}
            />
            <div className="flex gap-4 overflow-x-auto flex-nowrap scrollbar-hidden">
                {allChildren}
            </div>
        </section>
    );
};

export default CardsContainer;
