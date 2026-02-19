import { IoImageOutline } from 'react-icons/io5';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import { THEME_COLORS } from '@shared/constant/THEME_COLORS';
import AlertBanner from '@shared/component/notification/AlertBanner';
import StyledSelect from '@shared/component/ui/StyledSelect';

import { CommentInput, SortComments, CommentsList } from '@feature/comment';

import { useChapterReader } from '@feature/chapter';

// TODO: Refatorar esse componente, ele está muito grande e precisa ser dividido em subcomponentes menores para melhorar a legibilidade e manutenção. Talvez criar um componente específico para o leitor de capítulos, outro para a navegação entre capítulos e outro para os comentários.
const Chapter = () => {
    const {
        titleId,
        chapterId,
        currentTitle,
        isLoading,
        isInvalidChapter,
        bottomNavRef,
        imageError,
        setImageError,
        handleChapterChange,
    } = useChapterReader();

    if (isInvalidChapter) {
        return (
            <MainContent>
                <AlertBanner
                    color={THEME_COLORS.QUINARY}
                    title="Capítulo não encontrado"
                    message="O capítulo que você está tentando acessar não existe."
                    link={`/title/${titleId}`}
                    linkText="Voltar para página do título"
                />
            </MainContent>
        );
    }

    return (
        <>
            <Header />
            <MainContent>
                <section>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-center w-full border bg-secondary h-80 rounded-xs border-tertiary">
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
                                    <span className="object-cover w-full rounded-md h-80">
                                        Carregando imagem do título...
                                    </span>
                                </div>
                            )}
                            {!imageError && !isLoading && (
                                <img
                                    src={currentTitle?.cover}
                                    alt={currentTitle?.name}
                                    onError={() => setImageError(true)}
                                    className="object-cover w-full rounded-md h-80"
                                />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <div>
                                <form>
                                    <StyledSelect
                                        variant="default"
                                        name="chapter"
                                        onChange={handleChapterChange}
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
                            <StyledSelect
                                variant="chapter"
                                name="chapter"
                                onChange={handleChapterChange}
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
            </MainContent>
            <Footer />
        </>
    );
};

export default Chapter;
