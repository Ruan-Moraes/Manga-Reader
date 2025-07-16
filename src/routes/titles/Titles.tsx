import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { ERROR_MESSAGES } from '../../constants/API_CONSTANTS';
import { COLORS } from '../../constants/COLORS';

import { TitleTypes } from '../../types/TitleTypes';
import { CommentTypes } from '../../types/CommentTypes';

import useTitle from '../../hooks/titles/useTitle';
import useComments from '../../hooks/comments/useComments';
import useBookmark from '../../hooks/titles/useBookmark';
import useRating from '../../hooks/titles/useRating';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import Loading from '../loading/Loading';

import Warning from '../../components/notifications/Warning';
import Card from '../../components/cards/base/Card';
import TitleActions from '../../components/actions/TitleActions';
import ChapterFilter from '../../components/filters/ChapterFilter';
import ChapterList from '../../components/chapters/ChapterList';
import CommentsSection from '../../components/comments/CommentsSection';
import RatingModal from '../../components/modals/no-context/rating/RatingModal';
import InfoModal from '../../components/modals/no-context/info/InfoModal';

const Titles = () => {
    const [isRatingModalOpen, setIsRatingModalOpen] = useState<boolean>(false);
    const [isGroupsModalOpen, setIsGroupsModalOpen] = useState<boolean>(false);
    const [isCartModalOpen, setIsCartModalOpen] = useState<boolean>(false);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

    const [isAscending, setIsAscending] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const id = Number(useParams().titleId!);

    const {
        title,
        isLoading: isTitleLoading,
        isError: isTitleError,
        error: titleError,
    } = useTitle(id);

    const {
        comments,
        isLoading: isCommentsLoading,
        isError: isCommentsError,
        error: commentsError,
    } = useComments(id);

    const { toggleBookmark, bookmarkData } = useBookmark();
    const { submitRating, isSubmittingRating } = useRating();

    if (isTitleLoading) {
        return <Loading />;
    }

    if (isTitleError) {
        return (
            <Main>
                <Warning
                    title="Ops! Ocorreu um erro."
                    message={
                        titleError instanceof Error
                            ? titleError.message
                            : ERROR_MESSAGES.UNKNOWN_ERROR
                    }
                    color={COLORS.QUINARY}
                />
            </Main>
        );
    }

    const {
        type,
        cover,
        name,
        synopsis,
        genres,
        chapters,
        popularity,
        score,
        author,
        artist,
        publisher,
    } = title as TitleTypes;

    const handleChapterClick = (chapterNumber: string) => {
        console.log(`Chapter ${chapterNumber} clicked`);
    };

    const handleSortClick = () => {
        setIsAscending(prevState => !prevState);
    };

    const handleSearchSubmit = (searchTerm: string) => {
        setSearchTerm(searchTerm);
    };

    const handleBookmarkClick = () => {
        toggleBookmark(id, isBookmarked);
    };

    const handleLikeClick = () => {
        setIsRatingModalOpen(true);
    };

    const handleGroupsClick = () => {
        setIsGroupsModalOpen(true);
    };

    const handleCartClick = () => {
        setIsCartModalOpen(true);
    };

    const handleRatingSubmit = (rating: number) => {
        submitRating(id, rating);
    };

    if (bookmarkData && bookmarkData.titleId === id) {
        if (isBookmarked !== bookmarkData.isBookmarked) {
            setIsBookmarked(bookmarkData.isBookmarked);
        }
    }

    const filteredAndSortedChapters = [...chapters]
        .filter(chapter => {
            if (!searchTerm.trim()) return true;

            const searchLower = searchTerm.toLowerCase();

            return (
                chapter.number.toLowerCase().includes(searchLower) ||
                chapter.title.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => {
            const numA = parseFloat(a.number);
            const numB = parseFloat(b.number);

            if (isNaN(numA) && isNaN(numB)) {
                return 0;
            }

            if (isNaN(numA)) {
                return isAscending ? 1 : -1;
            }

            if (isNaN(numB)) {
                return isAscending ? -1 : 1;
            }

            return isAscending ? numA - numB : numB - numA;
        });

    return (
        <>
            <Header />
            <Main>
                <section>
                    <Card
                        showType={true}
                        shouldLoadCardData={false}
                        isLoading={false}
                        id={String(id)}
                        type={type}
                        cover={cover}
                        name={name}
                        synopsis={synopsis}
                        genres={genres}
                        chapters={chapters}
                        popularity={popularity}
                        score={score}
                        author={author}
                        artist={artist}
                        publisher={publisher}
                    />
                    <TitleActions
                        onBookmarkClick={handleBookmarkClick}
                        onLikeClick={handleLikeClick}
                        onGroupsClick={handleGroupsClick}
                        onCartClick={handleCartClick}
                    />
                </section>
                <section className="flex flex-col gap-4">
                    <ChapterFilter
                        onSortClick={handleSortClick}
                        onSearchSubmit={handleSearchSubmit}
                        isAscending={isAscending}
                    />
                    <ChapterList
                        key={`${isAscending ? 'ASC' : 'DESC'}-${searchTerm}`}
                        chapters={filteredAndSortedChapters}
                        onChapterClick={handleChapterClick}
                    />
                </section>
                <CommentsSection
                    comments={comments as CommentTypes[]}
                    isLoading={isCommentsLoading}
                    isError={isCommentsError}
                    error={commentsError}
                />
            </Main>
            <Footer />
            <RatingModal
                isModalOpen={isRatingModalOpen}
                closeModal={() => setIsRatingModalOpen(false)}
                onSubmitRating={handleRatingSubmit}
                isSubmitting={isSubmittingRating}
            />
            <InfoModal
                isModalOpen={isGroupsModalOpen}
                closeModal={() => setIsGroupsModalOpen(false)}
                title="Grupos de Tradução"
                message="Aqui você pode encontrar informações sobre os grupos de tradução responsáveis por esta obra."
                linkText="Ver Grupos"
                linkUrl="https://example.com/groups"
            />
            <InfoModal
                isModalOpen={isCartModalOpen}
                closeModal={() => setIsCartModalOpen(false)}
                title="Adicionar ao Carrinho"
                message="Adicione esta obra ao seu carrinho para compra ou acompanhamento."
                linkText="Ir ao Carrinho"
                linkUrl="https://example.com/cart"
            />
        </>
    );
};

export default Titles;
