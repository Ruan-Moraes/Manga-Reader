import { useParams } from 'react-router-dom';

import { ERROR_MESSAGES } from '../../constants/API_CONSTANTS';
import { COLORS } from '../../constants/COLORS';

import useTitle from '../../hooks/titles/useTitle';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import Card from '../../components/cards/title/Card';
import TitleActions from '../../components/actions/TitleActions';
import ChapterFilter from '../../components/filters/ChapterFilter';
import ChapterList from '../../components/chapters/ChapterList';
import CommentsSection from '../../components/comments/CommentsSection';
import Warning from '../../components/notifications/Warning';

const Titles = () => {
    const id = Number(useParams().title!);

    const { data: title, isLoading, isError, error } = useTitle(id);

    if (isError) {
        return (
            <Main>
                <Warning
                    title="Erro ao carregar título"
                    message={
                        error instanceof Error
                            ? error.message
                            : ERROR_MESSAGES.UNKNOWN_ERROR
                    }
                    color={COLORS.QUINARY}
                />
            </Main>
        );
    }

    if (isLoading || !title) {
        return (
            <Main>
                <Warning
                    title="Carregando título..."
                    message="Por favor, aguarde enquanto o título é carregado."
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
    } = title;

    // Mock chapter data
    const chapterData = [
        {
            number: '24',
            title: 'O legado dos antigos',
            date: '13/03/2003',
            pages: '54',
        },
        {
            number: '23',
            title: 'A verdadeira batalha',
            date: '06/03/2003',
            pages: '54',
        },
        {
            number: '22',
            title: 'O destino de Konoha',
            date: '27/02/2003',
            pages: '54',
        },
        {
            number: '21',
            title: 'O treino final',
            date: '20/02/2003',
            pages: '54',
        },
        {
            number: '20',
            title: 'O guardião de Konoha',
            date: '13/02/2003',
            pages: '54',
        },
        {
            number: '19',
            title: 'Reencontro inesperado',
            date: '06/02/2003',
            pages: '54',
        },
        {
            number: '18',
            title: 'Os segredos de Orochimaru',
            date: '30/01/2003',
            pages: '54',
        },
        {
            number: '17',
            title: 'Choque de forças',
            date: '23/01/2003',
            pages: '54',
        },
        {
            number: '16',
            title: 'Plano de fuga',
            date: '16/01/2003',
            pages: '54',
        },
        {
            number: '15',
            title: 'A decisão de Sasuke',
            date: '09/01/2003',
            pages: '54',
        },
        {
            number: '14',
            title: 'O ataque inesperado',
            date: '02/01/2003',
            pages: '54',
        },
        {
            number: '13',
            title: 'O despertar do poder',
            date: '26/12/2002',
            pages: '54',
        },
        {
            number: '12',
            title: 'O desafio de Gaara!!',
            date: '19/12/2002',
            pages: '54',
        },
        {
            number: '11',
            title: 'Exame Chunnin, começa!',
            date: '12/12/2002',
            pages: '54',
        },
        {
            number: '10',
            title: 'O exame chunnin',
            date: '05/12/2002',
            pages: '54',
        },
        {
            number: '9',
            title: 'Kakashi-sensei',
            date: '28/11/2002',
            pages: '54',
        },
        {
            number: '8',
            title: 'Desafio de vida ou morte',
            date: '21/11/2002',
            pages: '54',
        },
        {
            number: '7',
            title: 'Os rivais de Konoha',
            date: '14/11/2002',
            pages: '54',
        },
        { number: '6', title: 'Decisão', date: '07/11/2002', pages: '54' },
        {
            number: '5',
            title: 'Exame de Graduação',
            date: '31/10/2002',
            pages: '54',
        },
        { number: '4', title: 'Os rivais', date: '24/10/2002', pages: '54' },
        { number: '3', title: 'Time 7', date: '17/10/2002', pages: '54' },
        {
            number: '2',
            title: 'Conhecendo os colegas',
            date: '10/10/2002',
            pages: '54',
        },
        {
            number: '1',
            title: 'Naruto Uzumaki',
            date: '03/10/2002',
            pages: '54',
        },
    ];

    // TODO: Fazer mock de comentários | TO JUNIE: Do not execute this task now.

    const handleChapterClick = (chapterNumber: string) => {
        console.log(`Chapter ${chapterNumber} clicked`);
    };

    return (
        <>
            <Header />
            <Main>
                <section>
                    <Card
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
                    <ChapterFilter // TODO: Implementar função | TO JUNIE: Do not execute this task now.
                        onSortClick={() => console.log('Sort clicked')}
                        onSearchSubmit={searchTerm =>
                            console.log('Search submitted:', searchTerm)
                        }
                    />
                    <ChapterList
                        chapters={chapterData}
                        onChapterClick={handleChapterClick}
                    />
                </section>
                <CommentsSection />
            </Main>
            <Footer />
        </>
    );
};

export default Titles;
