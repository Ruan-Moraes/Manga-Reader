import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select, { SingleValue } from 'react-select';

import { COLORS } from '../../constants/COLORS';

import Header from './../../layouts/Header';
import Main from './../../layouts/Main';
import Footer from './../../layouts/Footer';

import Warning from '../../components/notifications/Warning';
import CommentInput from '../../components/inputs/CommentInput';
import FilterComments from '../../components/comments/FilterComments';
// import Comment from '../../components/comments/Comment';
// import { MdAdminPanelSettings } from 'react-icons/md';
// import { MdStar } from 'react-icons/md';
import CommentsList from '../../components/comments/CommentsList';

const Chapter = () => {
    const navigate = useNavigate();

    const titleId = useParams().title;
    const chapterId = useParams().chapter;

    const bottomNavRef = useRef<HTMLDivElement | null>(null);

    // const [isScrollingUp, setIsScrollingUp] = useState<boolean>(false);
    // const [previousScrollPosition, setPreviousScrollPosition] =
    //   useState<number>(0);
    // const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const [isBottomNavVisible, setIsBottomNavVisible] = useState(false);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    useEffect(() => {
        const handleResize = () => {
            const newHeight = window.innerHeight;

            if (newHeight < windowHeight) {
                setIsBottomNavVisible(true);
            }

            if (newHeight > windowHeight) {
                setIsBottomNavVisible(false);
            }

            setWindowHeight(newHeight);
        };

        if (bottomNavRef.current) {
            if (isBottomNavVisible) {
                bottomNavRef.current.style.transform =
                    'translateY(calc(0% - 0.5rem))';
            }

            if (!isBottomNavVisible) {
                bottomNavRef.current.style.transform = 'translateY(calc(100%))';
            }
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [windowHeight, isBottomNavVisible]);

    // useEffect(() => {
    //   const handleScroll = () => {
    //     const currentScrollPosition =
    //       window.pageYOffset || document.documentElement.scrollTop;

    //     if (timeoutId) {
    //       clearTimeout(timeoutId);
    //     }

    //     const newTimeoutId = setTimeout(() => {
    //       if (currentScrollPosition < previousScrollPosition) {
    //         setIsScrollingUp(true);
    //       } else {
    //         setIsScrollingUp(false);
    //       }

    //       setPreviousScrollPosition(
    //         currentScrollPosition <= 0 ? 0 : currentScrollPosition
    //       );

    //       if (isScrollingUp) {
    //         if (bottomNavRef.current) {
    //           bottomNavRef.current.style.transform = 'translateY(0)';
    //         }
    //       } else {
    //         if (bottomNavRef.current) {
    //           bottomNavRef.current.style.transform = 'translateY(100%)';
    //         }
    //       }
    //     }, 75);

    //     setTimeoutId(newTimeoutId);
    //   };

    //   document.addEventListener('scroll', handleScroll);

    //   return () => {
    //     if (timeoutId) {
    //       clearTimeout(timeoutId);
    //     }
    //     document.removeEventListener('scroll', handleScroll);
    //   };
    // }, [previousScrollPosition, isScrollingUp, timeoutId]);

    if (isNaN(Number(chapterId))) {
        // TODO: Implementar uma maneira de lidar com capítulos inválidos

        return (
            <Main>
                <Warning
                    title="Capítulo não encontrado"
                    message="O capítulo que você está tentando acessar não existe."
                    color={COLORS.QUINARY}
                    linkText="Voltar para página do título"
                    link={`/titles/${titleId}`}
                />
            </Main>
        );
    }

    const handleChange = (
        newValue: SingleValue<{ value: string | undefined; label: string }>,
    ) => {
        navigate(`/Manga-Reader/titles/${titleId}/${newValue?.value}`);
    };

    return (
        <>
            <Header />
            <Main>
                <section>
                    <div className="flex flex-col gap-2">
                        <div>
                            <h2
                                className="overflow-hidden text-xl font-bold"
                                style={{
                                    display: '-webkit-box',
                                    WebkitBoxOrient: 'vertical',
                                    WebkitLineClamp: 3,
                                }}
                            >
                                Naruto Clássico
                            </h2>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div>
                                <form>
                                    <Select
                                        name="chapter"
                                        onChange={handleChange}
                                        defaultValue={{
                                            value: chapterId,
                                            label: `Capítulo ${chapterId}`,
                                        }}
                                        isClearable={false}
                                        isSearchable={false}
                                        noOptionsMessage={() => 'Carregando...'}
                                        options={[
                                            {
                                                value: '1',
                                                label: 'Capítulo 1',
                                            },
                                            {
                                                value: '2',
                                                label: 'Capítulo 2',
                                            },
                                            {
                                                value: '3',
                                                label: 'Capítulo 3',
                                            },
                                            {
                                                value: '4',
                                                label: 'Capítulo 4',
                                            },
                                            {
                                                value: '5',
                                                label: 'Capítulo 5',
                                            },
                                            {
                                                value: '6',
                                                label: 'Capítulo 6',
                                            },
                                            {
                                                value: '7',
                                                label: 'Capítulo 7',
                                            },
                                            {
                                                value: '8',
                                                label: 'Capítulo 8',
                                            },
                                            {
                                                value: '9',
                                                label: 'Capítulo 9',
                                            },
                                            {
                                                value: '10',
                                                label: 'Capítulo 10',
                                            },
                                        ]}
                                        styles={{
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                padding: '0.5rem',
                                                backgroundColor: '#252526',
                                                borderRadius: '0.125rem',
                                                border: state.isFocused
                                                    ? '0.0625rem solid #ddda2a'
                                                    : '0.0625rem solid #727273',
                                                boxShadow: state.isFocused
                                                    ? '0 0 0 0'
                                                    : '0 0 0 0',
                                                cursor: 'text',
                                                transition: 'border 0.3s',
                                                '&:hover': {
                                                    border: state.isFocused
                                                        ? 0
                                                        : 0,
                                                },
                                            }),
                                            placeholder: baseStyles => ({
                                                ...baseStyles,
                                                fontSize: '0.875rem',
                                                lineHeight: '1rem',
                                                color: '#FFFFFF',
                                            }),
                                            valueContainer: baseStyles => ({
                                                ...baseStyles,
                                                padding: '0',
                                            }),
                                            input: baseStyles => ({
                                                ...baseStyles,
                                                margin: '0 0 0 0.25rem',
                                                padding: '0',
                                                color: '#FFFFFF',
                                            }),
                                            singleValue: baseStyles => ({
                                                ...baseStyles,
                                                color: '#FFFFFF',
                                            }),
                                            multiValue: baseStyles => ({
                                                ...baseStyles,
                                                margin: '0.125rem',
                                                padding: '0.25rem',
                                                borderRadius: '0.125rem',
                                                backgroundColor: '#161616',
                                                transition:
                                                    'background-color 0.3s',
                                                ':hover': {
                                                    backgroundColor:
                                                        '#161616bf',
                                                },
                                            }),
                                            multiValueLabel: baseStyles => ({
                                                ...baseStyles,
                                                fontSize: '0.875rem',
                                                lineHeight: '1rem',
                                                color: '#FFFFFF',
                                            }),
                                            menu: baseStyles => ({
                                                ...baseStyles,
                                                borderRadius: '0.125rem',
                                                border: '0.125rem solid #727273',
                                                backgroundColor: '#161616',
                                            }),
                                            menuList: baseStyles => ({
                                                ...baseStyles,
                                                padding: '0',
                                                overflowX: 'hidden',
                                            }),
                                            option: (baseStyles, state) => ({
                                                ...baseStyles,
                                                backgroundColor:
                                                    state.isSelected
                                                        ? '#ddda2a'
                                                        : '#161616',
                                                color: state.isSelected
                                                    ? '#161616'
                                                    : '#FFFFFF',
                                                ':hover': {
                                                    backgroundColor: '#ddda2a',
                                                    color: '#161616',
                                                },
                                                borderBottom:
                                                    '0.0625rem solid #727273',
                                                ':last-child': {
                                                    borderBottom: '0',
                                                },
                                            }),
                                            dropdownIndicator: baseStyles => ({
                                                ...baseStyles,
                                                padding: '0.125rem',
                                                margin: '0 0 0 6px',
                                                cursor: 'pointer',
                                                transition:
                                                    'background-color 0.3s',
                                                ':hover': {
                                                    backgroundColor:
                                                        '#ddda2a80',
                                                },
                                            }),
                                            indicatorSeparator: baseStyles => ({
                                                ...baseStyles,
                                                margin: '0',
                                                backgroundColor: '#727273',
                                            }),
                                        }}
                                    />
                                </form>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 border rounded-xs bg-secondary border-tertiary grow">
                                    Anterior
                                </button>
                                <button className="p-2 border rounded-xs bg-secondary border-tertiary grow">
                                    Próximo
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
                <section>
                    <div className="flex flex-col justify-center gap-0.5">
                        <div>
                            <img
                                src="https://fakeimg.pl/1024x1024?text=Capítulo"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://fakeimg.pl/1024x1024?text=Capítulo"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://fakeimg.pl/1024x1024?text=Capítulo"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://fakeimg.pl/1024x1024?text=Capítulo"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://fakeimg.pl/1024x1024?text=Capítulo"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://fakeimg.pl/1024x1024?text=Capítulo"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://fakeimg.pl/1024x1024?text=Capítulo"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://fakeimg.pl/1024x1024?text=Capítulo"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://fakeimg.pl/1024x1024?text=Capítulo"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://fakeimg.pl/1024x1024?text=Capítulo"
                                alt=""
                            />
                        </div>
                    </div>
                </section>
                <section>
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-2">
                            <div>
                                <h3 className="text-xl font-bold">
                                    Comentários
                                </h3>
                            </div>
                            <div className="flex flex-col gap-4">
                                <CommentInput placeholder="Deixe seu comentário" />
                                <FilterComments title="Filtar comentários por:" />
                            </div>
                        </div>
                        <div className="flex flex-col -mt-4">
                            <CommentsList />
                        </div>
                    </div>
                </section>
                <div
                    className="fixed bottom-[calc(0%_-_0.5rem)] shadow-black left-0 right-0 flex justify-center gap-2 p-2 m-4 mb-2 transition-all transform border duration-50 bg-secondary border-tertiary rounded-xs"
                    ref={bottomNavRef}
                >
                    <div className="grow">
                        <form>
                            <Select
                                name="chapter"
                                onChange={handleChange}
                                defaultValue={{
                                    value: chapterId,
                                    label: `Capítulo ${chapterId}`,
                                }}
                                isClearable={false}
                                isSearchable={false}
                                menuPlacement="top"
                                noOptionsMessage={() => 'Carregando...'}
                                options={[
                                    { value: '1', label: 'Capítulo 1' },
                                    { value: '2', label: 'Capítulo 2' },
                                    { value: '3', label: 'Capítulo 3' },
                                    { value: '4', label: 'Capítulo 4' },
                                    { value: '5', label: 'Capítulo 5' },
                                    { value: '6', label: 'Capítulo 6' },
                                    { value: '7', label: 'Capítulo 7' },
                                    { value: '8', label: 'Capítulo 8' },
                                    { value: '9', label: 'Capítulo 9' },
                                    { value: '10', label: 'Capítulo 10' },
                                ]}
                                styles={{
                                    control: (baseStyles, state) => ({
                                        ...baseStyles,
                                        padding: '0.5rem',
                                        backgroundColor: '#252526',
                                        borderRadius: '0.125rem',
                                        border: state.isFocused
                                            ? '0.0625rem solid #ddda2a'
                                            : '0.0625rem solid #727273',
                                        boxShadow: state.isFocused
                                            ? '0 0 0 0'
                                            : '0 0 0 0',
                                        cursor: 'text',
                                        transition: 'border 0.3s',
                                        '&:hover': {
                                            border: state.isFocused ? 0 : 0,
                                        },
                                    }),
                                    placeholder: baseStyles => ({
                                        ...baseStyles,
                                        fontSize: '0.875rem',
                                        lineHeight: '1rem',
                                        color: '#FFFFFF',
                                    }),
                                    valueContainer: baseStyles => ({
                                        ...baseStyles,
                                        padding: '0',
                                    }),
                                    input: baseStyles => ({
                                        ...baseStyles,
                                        margin: '0 0 0 0.25rem',
                                        padding: '0',
                                        color: '#FFFFFF',
                                    }),
                                    singleValue: baseStyles => ({
                                        ...baseStyles,
                                        color: '#FFFFFF',
                                    }),
                                    multiValue: baseStyles => ({
                                        ...baseStyles,
                                        margin: '0.125rem',
                                        padding: '0.25rem',
                                        borderRadius: '0.125rem',
                                        backgroundColor: '#161616',
                                        transition: 'background-color 0.3s',
                                        ':hover': {
                                            backgroundColor: '#161616bf',
                                        },
                                    }),
                                    multiValueLabel: baseStyles => ({
                                        ...baseStyles,
                                        borderBottom: '0.0625rem solid #ddda2a',
                                        fontSize: '0.875rem',
                                        lineHeight: '1rem',
                                        color: '#FFFFFF',
                                    }),
                                    menu: baseStyles => ({
                                        ...baseStyles,
                                        borderRadius: '0',
                                        borderTopRightRadius: '0.0625rem',
                                        borderTopLeftRadius: '0.0625rem',
                                        border: '0.0625rem solid #727273',
                                        backgroundColor: '#2525266',
                                        boxShadow: '0 0 0 0',
                                    }),
                                    menuList: baseStyles => ({
                                        ...baseStyles,
                                        padding: '0',
                                        overflowX: 'hidden',
                                    }),
                                    option: (baseStyles, state) => ({
                                        ...baseStyles,
                                        backgroundColor: state.isSelected
                                            ? '#ddda2a'
                                            : '#161616',
                                        color: state.isSelected
                                            ? '#161616'
                                            : '#FFFFFF',
                                        ':hover': {
                                            backgroundColor: '#ddda2a',
                                            color: '#161616',
                                        },
                                        borderBottom: '0.0625rem solid #727273',
                                        ':last-child': {
                                            borderBottom: '0',
                                        },
                                    }),
                                    dropdownIndicator: baseStyles => ({
                                        ...baseStyles,
                                        padding: '0.125rem',
                                        margin: '0 0 0 6px',
                                        rotate: '180deg',

                                        cursor: 'pointer',
                                        transition: 'background-color 0.3s',
                                        ':hover': {
                                            backgroundColor: '#ddda2a80',
                                        },
                                    }),
                                    indicatorSeparator: baseStyles => ({
                                        ...baseStyles,
                                        margin: '0',
                                        backgroundColor: '#727273',
                                    }),
                                }}
                            />
                        </form>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 border rounded-xs bg-secondary border-tertiary grow">
                            Anterior
                        </button>
                        <button className="p-2 border rounded-xs bg-secondary border-tertiary grow">
                            Próximo
                        </button>
                    </div>
                </div>
            </Main>
            <Footer />
        </>
    );
};

export default Chapter;
