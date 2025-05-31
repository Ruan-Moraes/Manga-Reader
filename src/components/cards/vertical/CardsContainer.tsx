import {useCallback, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import clsx from 'clsx';

import {CardsContainerTypes} from '../../../types/CardContainerTypes';

import UseFetchTitles from '../../../hooks/fetch/useFetchTitles';

import Section_Title from '../../titles/SectionTitle';
import Card from './Card';
import RaisedButton from '../../buttons/RaisedButton';

const CardsContainer = ({
                            url,
                            validTime,
                            title,
                            subTitle,
                        }: CardsContainerTypes) => {
    const navigate = useNavigate();

    const {data, status} = UseFetchTitles(url, validTime);
    const [visible, setVisible] = useState(10);

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return Object.values(data).map(
                ({id, type, cover, title, chapters, updatedAt}) => (
                    <Card
                        id={id}
                        type={type}
                        cover={cover}
                        title={title}
                        chapters={chapters}
                        updatedAt={updatedAt}
                        key={id}
                    />
                )
            );
        }

        if (status === 'pending') {
            return Array.from({length: 10}).map((_, index) => (
                <Card isLoading={true} key={index}/>
            ));
        }

        return Array.from({length: 1}).map((_, index) => (
            <Card isError={true} key={index}/>
        ));
    }, [data, status]);

    const handleClick = useCallback(() => {
        if (visible >= allChildren.length) {
            navigate('/Manga-Reader/categories?sort=most_recent&status=all');
        }

        if (visible < allChildren.length) {
            setVisible((prev) => prev + 10);
        }
    }, [visible, allChildren.length, navigate]);

    return (
        <section className="flex flex-col gap-4">
            <Section_Title
                title={title}
                subTitle={subTitle}
                subLink="/categories?sort=most_recent&status=all"
            />
            <div
                className={clsx('grid gap-x-2 gap-y-4', {
                    'grid-cols-2': status === 'success' || status === 'pending',
                    'grid-cols-1': status === 'error',
                })}
            >
                {allChildren.slice(0, visible)}
            </div>
            <RaisedButton onClick={handleClick} text="Ver Mais"/>
        </section>
    );
};

export default CardsContainer;
