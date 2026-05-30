import { useMemo } from 'react';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { ROUTES } from '@shared/constant/ROUTES';

import useTitlesFetch from '../../../hook/data/useTitlesFetch';

import { SectionHeader } from '@feature/manga';

import AppLink from '@shared/component/link/element/AppLink';

import HorizontalCard from './HorizontalCard';

const HorizontalCardsContainer = ({ title, subTitle }: SectionHeader) => {
    const { data, status } = useTitlesFetch(QUERY_KEYS.RANDOM_TITLES, 0, 10);

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return data?.content.map(({ id, type, cover, name, chaptersCount, ratingAverage }) => (
                <HorizontalCard
                    isLoading={false}
                    isError={false}
                    key={id}
                    id={id}
                    ratingAverage={ratingAverage}
                    chaptersCount={chaptersCount}
                    cover={cover}
                    name={name}
                    type={type}
                />
            ));
        }

        if (status === 'pending') {
            return Array.from({ length: 10 }).map((_, index) => <HorizontalCard isLoading={true} isError={false} key={index} />);
        }

        return <HorizontalCard isError={true} isLoading={false} />;
    }, [data, status]);

    return (
        <section className="flex flex-col gap-4">
            <div>
                <h2 className="font-bold text-2xl">{title}</h2>
                {subTitle && (
                    <p className="leading-none">
                        <AppLink link={ROUTES.FILTER_RANDOM} text={subTitle} className="text-xs text-quaternary-default" />
                    </p>
                )}
            </div>
            <div className="flex gap-4 overflow-x-auto flex-nowrap scrollbar-hidden">{allChildren}</div>
        </section>
    );
};

export default HorizontalCardsContainer;
