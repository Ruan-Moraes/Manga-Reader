import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { ERROR_MESSAGES } from '@shared/constant/API_CONSTANTS';
import { COLORS } from '@shared/constant/COLORS';

import { type Title, useTitle, BaseCard as Card, TitleActions } from '@feature/manga';
import { type CommentData, useComments, CommentsSection } from '@feature/comment';
import { useBookmark } from '@feature/library';
import { useRating, RatingStars, RatingModal } from '@feature/rating';
import { ChapterFilter, ChapterList } from '@feature/chapter';
import { GroupsModal } from '@feature/group';
import { StoresModal } from '@feature/store';

import Header from '@app/layout/Header';
import Main from '@app/layout/Main';
import Footer from '@app/layout/Footer';

import Loading from '@app/route/loading/Loading';

import Warning from '@shared/component/notification/Warning';
import {
    showInfoToast,
    showSuccessToast,
} from '@shared/service/util/toastUtils';

const Titles = () => {
    const [isRatingModalOpen, setIsRatingModalOpen] = useState<boolean>(false);
    const [isGroupsModalOpen, setIsGroupsModalOpen] = useState<boolean>(false);
    const [isCartModalOpen, setIsCartModalOpen] = useState<boolean>(false);

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

    const { toggleBookmark, isSaved } = useBookmark();
    const { submitRating, ratings, average } = useRating(String(id));

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
    } = title as Title;

    const handleSortClick = () => {
        setIsAscending(prevState => !prevState);
    };

    const handleBookmarkClick = () => {
        const wasSaved = isSaved(String(id));

        toggleBookmark({
            titleId: String(id),
            name,
            cover,
            type,
        });

        if (wasSaved) {
            showInfoToast('Mangá removido da sua biblioteca.');
            return;
        }

        showSuccessToast('Mangá salvo na sua biblioteca.');
    };

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
                    <div className="flex items-center justify-between px-2 py-2 mt-2 border rounded-xs border-tertiary bg-secondary">
                        <span className="text-sm font-semibold">
                            Média da comunidade
                        </span>
                        <RatingStars value={average} showValue />
                    </div>
                    <TitleActions
                        onBookmarkClick={handleBookmarkClick}
                        onLikeClick={() => setIsRatingModalOpen(true)}
                        onGroupsClick={() => setIsGroupsModalOpen(true)}
                        onCartClick={() => setIsCartModalOpen(true)}
                        isBookmarked={isSaved(String(id))}
                    />
                </section>
                <section className="flex flex-col gap-4">
                    <ChapterFilter
                        onSortClick={handleSortClick}
                        onSearchSubmit={setSearchTerm}
                        isAscending={isAscending}
                    />
                    <ChapterList
                        key={`${isAscending ? 'ASC' : 'DESC'}-${searchTerm}`}
                        chapters={filteredAndSortedChapters}
                        onChapterClick={() => undefined}
                    />
                </section>
                <section className="flex flex-col gap-2 p-3 border rounded-xs border-tertiary">
                    <h3 className="font-bold">Avaliações recentes</h3>
                    {ratings.slice(0, 5).map(review => (
                        <article
                            key={review.id}
                            className="p-2 border rounded-xs border-tertiary"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">
                                    {review.userName}
                                </span>
                                <RatingStars value={review.stars} size={12} />
                            </div>
                            {review.comment && (
                                <p className="mt-1 text-xs text-tertiary">
                                    {review.comment}
                                </p>
                            )}
                        </article>
                    ))}
                </section>
                <CommentsSection
                    comments={comments as CommentData[]}
                    isLoading={isCommentsLoading}
                    isError={isCommentsError}
                    error={commentsError}
                />
            </Main>
            <Footer />
            <RatingModal
                isModalOpen={isRatingModalOpen}
                closeModal={() => setIsRatingModalOpen(false)}
                onSubmitRating={submitRating}
            />
            <GroupsModal
                isModalOpen={isGroupsModalOpen}
                closeModal={() => setIsGroupsModalOpen(false)}
                titleId={String(id)}
            />
            <StoresModal
                isModalOpen={isCartModalOpen}
                closeModal={() => setIsCartModalOpen(false)}
                titleId={String(id)}
            />
        </>
    );
};

export default Titles;
