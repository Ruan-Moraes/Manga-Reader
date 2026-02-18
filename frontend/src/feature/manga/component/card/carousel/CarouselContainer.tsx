import { useEffect, useMemo, useRef } from 'react';
// @ts-expect-error - ignore import error
import { Splide } from '@splidejs/react-splide';
// @ts-expect-error - ignore import error
import '@splidejs/react-splide/css';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { ROUTES } from '@shared/constant/ROUTES';

import { SectionHeader } from '../../../type/section-header.types';

import useTitlesFetch from '../../../hook/data/useTitlesFetch';

import CarouselSlide from './CarouselSlide';
import AppLink from '@shared/component/link/element/AppLink';

const CarouselContainer = ({ title, subTitle }: SectionHeader) => {
    const { data, status } = useTitlesFetch(
        QUERY_KEYS.TITLES_IN_THE_CAROUSEL,
    );

    const splideRef = useRef<Splide>(null);

    useEffect(() => {
        if (splideRef.current) {
            const { root, track, list } =
                splideRef.current.splide.Components.Elements;

            if (root && track && list) {
                root.classList.add('h-full');
                track.classList.add('h-full');
                list.classList.add('h-full');
            }
        }
    }, [data]);

    const allChildren = useMemo(() => {
        if (status === 'success') {
            return (
                <Splide
                    options={{
                        type: 'fade',
                        rewind: true,
                        autoplay: true,
                        interval: 5000,
                        speed: 300,
                        pauseOnHover: true,
                        pauseOnFocus: true,
                        pagination: false,
                        arrows: true,
                        classes: {
                            arrow: `rounded-xs align-middle flex z-10 cursor-pointer w-8 px-2 py-2 bg-primary-opacity-80 absolute top-1/2 transform -translate-y-1/2 border border-tertiary`,
                        },
                    }}
                    ref={splideRef}
                >
                    {Object.values(data).map(
                        ({ id, title, cover, synopsis }) => (
                            <CarouselSlide
                                isLoading={false}
                                isError={false}
                                key={id}
                                id={id}
                                name={title}
                                cover={cover}
                                synopsis={synopsis}
                            />
                        ),
                    )}
                </Splide>
            );
        }

        if (status === 'pending') {
            return <CarouselSlide isLoading={true} isError={false} />;
        }

        return <CarouselSlide isError={true} isLoading={false} />;
    }, [data, status]);

    return (
        <section className="flex flex-col items-start">
            <div className="px-4 py-2 rounded-t-xs bg-tertiary">
                <h2 className="flex flex-col items-center text-center">
                    <AppLink
                        link={ROUTES.CATEGORIES_MOST_READ}
                        text={title}
                        className="text-shadow-default text-quaternary-default"
                    />
                    <span className="text-xs">({subTitle})</span>
                </h2>
            </div>
            <div className="w-full border rounded-xs rounded-tl-none border-tertiary h-[18rem] overflow-hidden">
                {allChildren}
            </div>
        </section>
    );
};

export default CarouselContainer;
