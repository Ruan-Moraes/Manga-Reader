import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select, { SelectOption } from '../../components/ui/Select';
import { SingleValue, MultiValue, ActionMeta } from 'react-select';
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
        newValue: MultiValue<SelectOption> | SingleValue<SelectOption>,
        actionMeta: ActionMeta<SelectOption>
    ) => {
        if (newValue && !Array.isArray(newValue)) {
            navigate(`/Manga-Reader/titles/${titleId}/${(newValue as SelectOption).value}`);
        }
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
                                        variant="default"
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
                                variant="chapter"
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
