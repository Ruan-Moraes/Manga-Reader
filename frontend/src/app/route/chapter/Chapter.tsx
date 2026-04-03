import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import { THEME_COLORS } from '@shared/constant/THEME_COLORS';
import AlertBanner from '@shared/component/notification/AlertBanner';

import { CommentInput, SortComments, CommentsList } from '@feature/comment';

import {
    useChapterReader,
    ChapterCoverImage,
    ChapterNavigation,
    ChapterPages,
    ChapterBottomBar,
} from '@feature/chapter';

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
                <ChapterCoverImage
                    currentTitle={currentTitle}
                    isLoading={isLoading}
                    imageError={imageError}
                    onImageError={() => setImageError(true)}
                />
                <ChapterNavigation
                    chapterId={chapterId}
                    onChapterChange={handleChapterChange}
                />
                <ChapterPages />
                <section>
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-2">
                            <div>
                                <h3 className="text-xl font-bold">
                                    Comentários
                                </h3>
                            </div>
                            <div className="flex flex-col gap-4">
                                <CommentInput
                                    placeholder="Deixe seu comentário"
                                    titleId={titleId}
                                />
                                <SortComments title="Ordernar comentários por:" />
                            </div>
                        </div>
                        <div className="flex flex-col -mt-4">
                            <CommentsList titleId={titleId} />
                        </div>
                    </div>
                </section>
                <ChapterBottomBar
                    ref={bottomNavRef}
                    chapterId={chapterId}
                    onChapterChange={handleChapterChange}
                />
            </MainContent>
            <Footer />
        </>
    );
};

export default Chapter;
