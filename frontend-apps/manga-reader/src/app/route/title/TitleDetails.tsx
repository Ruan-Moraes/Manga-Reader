import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import useAuth from '@feature/auth/hook/useAuth';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import Loading from '@app/route/loading/Loading';

import AlertBanner from '@shared/component/notification/AlertBanner';
import {
    showInfoToast,
    showSuccessToast,
} from '@shared/service/util/toastService';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import { THEME_COLORS } from '@shared/constant/THEME_COLORS';

import {
    type Title,
    useTitle,
    useTitleModals,
    BaseCard as Card,
    TitleActions,
} from '@feature/manga';
import { useComments, CommentsSection } from '@feature/comment';
import { useBookmark } from '@feature/library';
import {
    useRating,
    RatingStars,
    RatingModal,
    RecentReviews,
} from '@feature/rating';
import { ChapterFilter, ChapterList, useChapterSort } from '@feature/chapter';
import { GroupsModal } from '@feature/group';
import { StoresModal } from '@feature/store';
import { getStoredSession } from '@feature/auth/service/authService';
import { requireAuth } from '@shared/service/util/requireAuth';
import { recordView } from '@feature/user/service/userService';

const TitleDetailsPage = () => {
    const { t } = useTranslation('manga');
    const navigate = useNavigate();

    const { titleId: rawTitleId } = useParams();

    const id = Number(rawTitleId);

    const isValidId = rawTitleId !== undefined && !isNaN(id);

    const {
        isRatingModalOpen,
        isGroupsModalOpen,
        isCartModalOpen,
        openRatingModal,
        closeRatingModal,
        openGroupsModal,
        closeGroupsModal,
        openCartModal,
        closeCartModal,
    } = useTitleModals();

    const {
        title,
        isLoading: isTitleLoading,
        isError: isTitleError,
        error: titleError,
    } = useTitle(rawTitleId ?? '');

    // Fire-and-forget: registra visualização no histórico do usuário
    useEffect(() => {
        if (rawTitleId && getStoredSession()) {
            recordView(rawTitleId).catch(() => {});
        }
    }, [rawTitleId]);

    const { user: authUser } = useAuth();
    const isCommentsAdmin = authUser?.role === 'admin';
    const [commentsCrossLanguage, setCommentsCrossLanguage] = useState(false);
    const {
        comments,
        isLoading: isCommentsLoading,
        isError: isCommentsError,
        error: commentsError,
        refetchComments,
    } = useComments(rawTitleId ?? '', 0, 20, {
        crossLanguage: commentsCrossLanguage,
    });

    const {
        isAscending,
        searchTerm,
        setSearchTerm,
        handleSortClick,
        filteredAndSortedChapters,
    } = useChapterSort(
        title && !(title instanceof Error) ? title.chapters : [],
    );

    const { toggleBookmark, isSaved } = useBookmark();
    const { submitRating, ratings, average } = useRating(String(id));

    if (!isValidId) {
        return (
            <MainContent>
                <AlertBanner
                    title={t('titleDetails.invalidIdTitle')}
                    message={ERROR_MESSAGES.INVALID_ID_ERROR}
                    color={THEME_COLORS.QUINARY}
                />
            </MainContent>
        );
    }

    if (isTitleError) {
        return (
            <MainContent>
                <AlertBanner
                    title={t('titleDetails.errorTitle')}
                    message={
                        titleError instanceof Error
                            ? titleError.message
                            : ERROR_MESSAGES.UNKNOWN_ERROR
                    }
                    color={THEME_COLORS.QUINARY}
                />
            </MainContent>
        );
    }

    if (isTitleLoading) {
        return <Loading />;
    }

    const {
        type,
        cover,
        name,
        synopsis,
        genres,
        chapters,
        popularity,
        ratingAverage,
        ratingCount,
        rankingScore,
        author,
        artist,
        publisher,
        status,
        adult,
    } = title as Title;

    const handleBookmarkClick = async () => {
        if (!requireAuth(t('titleDetails.authActionBookmark'))) return;

        const nowSaved = await toggleBookmark({
            titleId: String(id),
            name,
            cover,
            type,
        });

        if (nowSaved) {
            showSuccessToast(t('titleDetails.savedToLibrary'));
        } else {
            showInfoToast(t('titleDetails.removedFromLibrary'));
        }
    };

    return (
        <>
            <Header />
            <MainContent>
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
                        ratingAverage={ratingAverage}
                        ratingCount={ratingCount}
                        rankingScore={rankingScore}
                        author={author}
                        artist={artist}
                        publisher={publisher}
                        status={status}
                        adult={adult}
                    />
                    <div className="flex items-center justify-between px-2 py-2 border border-tertiary bg-primary-default rounded-tr-xs">
                        <span className="text-sm font-semibold">
                            {t('titleDetails.communityAverage')}
                        </span>
                        <RatingStars value={average.average} />
                    </div>
                    <TitleActions
                        onBookmarkClick={handleBookmarkClick}
                        onLikeClick={() => {
                            if (!requireAuth(t('titleDetails.authActionRate')))
                                return;
                            openRatingModal();
                        }}
                        onGroupsClick={openGroupsModal}
                        onCartClick={openCartModal}
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
                        onChapterClick={chapterNumber => {
                            const basePath = import.meta.env.BASE_URL;

                            navigate(
                                `${basePath}/title/${id}/chapter/${chapterNumber}`,
                            );
                        }}
                    />
                </section>
                <RecentReviews ratings={ratings} />
                <CommentsSection
                    titleId={rawTitleId!}
                    comments={
                        comments instanceof Error || !comments ? [] : comments
                    }
                    isLoading={isCommentsLoading}
                    isError={isCommentsError}
                    error={commentsError}
                    onCommentCreated={refetchComments}
                    crossLanguage={commentsCrossLanguage}
                    onToggleCrossLanguage={
                        isCommentsAdmin
                            ? () => setCommentsCrossLanguage(v => !v)
                            : undefined
                    }
                />
            </MainContent>
            <Footer />
            <RatingModal
                isModalOpen={isRatingModalOpen}
                closeModal={closeRatingModal}
                onSubmitRating={submitRating}
            />
            <GroupsModal
                isModalOpen={isGroupsModalOpen}
                closeModal={closeGroupsModal}
                titleId={id}
            />
            <StoresModal
                isModalOpen={isCartModalOpen}
                closeModal={closeCartModal}
                titleId={String(id)}
            />
        </>
    );
};

export default TitleDetailsPage;
