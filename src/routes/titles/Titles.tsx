import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { ERROR_MESSAGES } from '../../constants/API_CONSTANTS';
import { COLORS } from '../../constants/COLORS';

import { TitleTypes } from '../../types/TitleTypes';
import { CommentTypes } from '../../types/CommentTypes';

import useTitle from '../../hooks/titles/useTitle';
import useComments from '../../hooks/comments/useComments';

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

const Titles = () => {
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
                    <TitleActions // TODO: Implementar funções | TO JUNIE: Do not execute this task now.
                        onBookmarkClick={() => console.log('Bookmark clicked')}
                        onLikeClick={() => console.log('Like clicked')}
                        onGroupsClick={() => console.log('Groups clicked')}
                        onCartClick={() => console.log('Cart clicked')}
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
        </>
    );
};

export default Titles;
