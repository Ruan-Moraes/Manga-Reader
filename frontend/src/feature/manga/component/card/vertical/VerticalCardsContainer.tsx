import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import clsx from 'clsx';

import { API_URLS } from '@shared/constant/API_URLS';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { ROUTES } from '@shared/constant/ROUTES';

import { SectionHeader } from '../../../type/section-header.types';

import useTitlesFetch from '../../../hook/data/useTitlesFetch';

import SectionTitle from '@shared/component/title/SectionTitle';
import VerticalCard from './VerticalCard';
import RaisedButton from '@shared/component/button/RaisedButton';

const VerticalCardsContainer = ({ title, subTitle }: SectionHeader) => {
    const navigate = useNavigate();

    const { data, status } = useTitlesFetch(
        API_URLS.TITLE_URL,
        QUERY_KEYS.UPDATED_TITLES,
    );

    const [visible, setVisible] = useState(10);

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return Object.values(data).map(
                ({ id, type, cover, name, chapters, updatedAt }) => (
                    <VerticalCard
                        isLoading={false}
                        isError={false}
                        key={id}
                        id={id}
                        type={type}
                        cover={cover}
                        name={name}
                        chapters={chapters}
                        updatedAt={updatedAt}
                    />
                ),
            );
        }

        if (status === 'pending') {
            return Array.from({ length: 10 }).map((_, index) => (
                <VerticalCard isLoading={true} isError={false} key={index} />
            ));
        }

        return Array.from({ length: 1 }).map((_, index) => (
            <VerticalCard isError={true} isLoading={false} key={index} />
        ));
    }, [data, status]);

    const handleClick = useCallback(() => {
        if (visible >= allChildren.length) {
            navigate(ROUTES.WEB_URL + ROUTES.CATEGORIES_MOST_RECENT);
        }

        if (visible < allChildren.length) {
            setVisible(prev => prev + 10);
        }
    }, [visible, allChildren.length, navigate]);

    return (
        <section className="flex flex-col gap-4">
            <SectionTitle
                title={title}
                subTitle={subTitle}
                subLink={ROUTES.CATEGORIES_MOST_RECENT}
            />
            <div
                className={clsx('grid gap-x-2 gap-y-4', {
                    'grid-cols-2': status === 'success' || status === 'pending',
                    'grid-cols-1': status === 'error',
                })}
            >
                {allChildren.slice(0, visible)}
            </div>
            <RaisedButton onClick={handleClick} text="Ver Mais" />
        </section>
    );
};

export default VerticalCardsContainer;
