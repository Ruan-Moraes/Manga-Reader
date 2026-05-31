import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import clsx from 'clsx';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { ROUTES } from '@shared/constant/ROUTES';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';

import { SectionHeader } from '../../../model/section-header.types';

import useTitlesFetch from '../../../model/data/useTitlesFetch';

import AppLink from '@ui/AppLink';
import VerticalCard from './VerticalCard';
import { Button } from '@ui/Button';

const VerticalCardsContainer = ({ title, subTitle }: SectionHeader) => {
    const { t } = useTranslation('manga');
    const navigate = useNavigate();

    const { data, status } = useTitlesFetch(QUERY_KEYS.UPDATED_TITLES, 0, 10);

    const [visible, setVisible] = useState(10);

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return data?.content.map(({ id, type, cover, name, ratingAverage, latestChapterNumber, updatedAt }) => (
                <VerticalCard
                    isLoading={false}
                    isError={false}
                    key={id}
                    id={id}
                    type={type}
                    cover={cover}
                    name={name}
                    ratingAverage={ratingAverage}
                    latestChapterNumber={latestChapterNumber}
                    updatedAt={updatedAt}
                />
            ));
        }

        if (status === 'pending') {
            return Array.from({ length: 10 }).map((_, index) => <VerticalCard isLoading={true} isError={false} key={index} />);
        }

        return Array.from({ length: 1 }).map((_, index) => <VerticalCard isError={true} isLoading={false} key={index} />);
    }, [data, status]);

    const handleClick = useCallback(() => {
        if (visible >= allChildren.length) {
            navigate(WEB_BASE_URL + ROUTES.CATALOG_SORT('most_recent'));
        }

        if (visible < allChildren.length) {
            setVisible(prev => prev + 10);
        }
    }, [visible, allChildren.length, navigate]);

    return (
        <section className="flex flex-col gap-4">
            <div>
                <h2 className="font-bold text-2xl">{title}</h2>
                {subTitle && (
                    <p className="leading-none">
                        <AppLink link={ROUTES.CATALOG_SORT('most_recent')} text={subTitle} className="text-xs text-quaternary-default" />
                    </p>
                )}
            </div>
            <div
                className={clsx('grid gap-x-2 gap-y-4', {
                    'grid-cols-2': status === 'success' || status === 'pending',
                    'grid-cols-1': status === 'error',
                })}
            >
                {allChildren.slice(0, visible)}
            </div>
            <Button onClick={handleClick} block>
                {t('card.loadMore')}
            </Button>
        </section>
    );
};

export default VerticalCardsContainer;
