import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import clsx from 'clsx';

import { API_URLS, QUERY_KEYS, ROUTES } from '../../../constants/API_CONSTANTS';

import { CardsContainerTypes } from '../../../types/CardContainerTypes';

import useTitlesFetch from '../../../hooks/titles/data/useTitlesFetch';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';
import RaisedButton from '../../buttons/RaisedButton';

const CardsContainer = ({ title, subTitle }: CardsContainerTypes) => {
    const navigate = useNavigate();

    const { data, status } = useTitlesFetch(
        API_URLS.TITLE_URL,
        QUERY_KEYS.UPDATED_TILTES,
    );
    const [visible, setVisible] = useState(10);

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return Object.values(data).map(
                ({ id, type, cover, title, chapters, updatedAt }) => (
                    <Card
                        id={id}
                        type={type}
                        cover={cover}
                        title={title}
                        chapters={chapters}
                        updatedAt={updatedAt}
                        key={id}
                    />
                ),
            );
        }

        if (status === 'pending') {
            return Array.from({ length: 10 }).map((_, index) => (
                <Card isLoading={true} key={index} />
            ));
        }

        return Array.from({ length: 1 }).map((_, index) => (
            <Card isError={true} key={index} />
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
            <Section_Title
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

export default CardsContainer;
