import { useMemo } from 'react';

import { API_URLS } from '@shared/constant/API_URLS';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { ROUTES } from '@shared/constant/ROUTES';

import useTitlesFetch from '../../../hook/data/useTitlesFetch';

import { SectionHeader } from '../../../type/section-header.types';

import SectionTitle from '@shared/component/title/SectionTitle';
import HorizontalCard from './HorizontalCard';

const HorizontalCardsContainer = ({ title, subTitle }: SectionHeader) => {
    const { data, status } = useTitlesFetch(
        API_URLS.TITLE_URL,
        QUERY_KEYS.RANDOM_TITLES,
    );

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return Object.values(data).map(
                ({ id, type, cover, name, chapters }) => (
                    <HorizontalCard
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
                <HorizontalCard isLoading={true} isError={false} key={index} />
            ));
        }

        return <HorizontalCard isError={true} isLoading={false} />;
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

export default HorizontalCardsContainer;
