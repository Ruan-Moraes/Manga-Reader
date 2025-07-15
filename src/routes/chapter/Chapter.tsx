import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select, { SingleValue } from 'react-select';
import { IoImageOutline } from 'react-icons/io5';

import { COLORS } from '../../constants/COLORS';

import Header from './../../layouts/Header';
import Main from './../../layouts/Main';
import Footer from './../../layouts/Footer';

import Warning from '../../components/notifications/Warning';
import CommentInput from '../../components/inputs/CommentInput';
import SortComments from '../../components/comments/SortComments';
// import Comment from '../../components/comments/Comment';
// import { MdAdminPanelSettings } from 'react-icons/md';
// import { MdStar } from 'react-icons/md';
import CommentsList from '../../components/comments/CommentsList';

import useTitles from '../../hooks/titles/useTitles';

const Chapter = () => {
    const navigate = useNavigate();

    const titleId: string = useParams().title;
    const chapterId: string = useParams().chapter;

    const { titles, isLoading, isError, error } = useTitles(titleId);

    const currentTitle =
        titles && titles.length > 0
            ? titles.find(title => title.id === titleId) ||
              titles[Number(titleId)]
            : undefined;

    const bottomNavRef = useRef<HTMLDivElement | null>(null);

    // const [isScrollingUp, setIsScrollingUp] = useState<boolean>(false);
    // const [previousScrollPosition, setPreviousScrollPosition] =
    //   useState<number>(0);
    // const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const [isBottomNavVisible, setIsBottomNavVisible] = useState(false);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [imageError, setImageError] = useState<boolean>(false);

    const handleImageError = () => {
        setImageError(true);
    };

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
                    color={COLORS.QUINARY}
                    title="Capítulo não encontrado"
                    message="O capítulo que você está tentando acessar não existe."
                    link={`/titles/${titleId}`}
                    linkText="Voltar para página do título"
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
                    <div className="flex flex-col gap-4">
                        <div className="bg-secondary flex items-center justify-center w-full h-80 rounded-xs border border-tertiary">
                            {imageError && (
                                <div className="flex flex-col items-center justify-center">
                                    <IoImageOutline
                                        size={96}
                                        className="text-tertiary"
                                    />
                                    <span className="mt-2 text-sm text-center text-tertiary">
                                        Não foi possível carregar a imagem
                                    </span>
                                </div>
                            )}
                            {!imageError && isLoading && (
                                <div>
                                    <span className="w-full h-80 object-cover rounded-md">
                                        Carregando imagem do título...
                                    </span>
                                </div>
                            )}
                            {!imageError && !isLoading && (
                                <img
                                    src={currentTitle?.coverImage}
                                    alt={currentTitle?.title}
                                    className="w-full h-80 object-cover rounded-md"
                                />
                            )}
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
                            <img src="https://p/png" alt="" />
                        </div>
                        <div>
                            <img
                                src="https://placehold.co/600x800/png"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://placehold.co/600x800/png"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://placehold.co/600x800/png"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://placehold.co/600x800/png"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://placehold.co/600x800/png"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://placehold.co/600x800/png"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://placehold.co/600x800/png"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://placehold.co/600x800/png"
                                alt=""
                            />
                        </div>
                        <div>
                            <img
                                src="https://placehold.co/600x800/png"
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
                                <SortComments title="Ordernar comentários por:" />
                            </div>
                        </div>
                        <div className="flex flex-col -mt-4">
                            <CommentsList />
                        </div>
                    </div>
                </section>
                <div
                    className="fixed bottom-[calc(0%_-_0.5rem)] shadow-black left-0 right-0 flex justify-center gap-2 p-2 m-4 mb-2 transition-all transform border duration-300 bg-secondary border-tertiary rounded-xs"
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
