import { Link, useParams } from 'react-router-dom';
import {
    FiArrowUp,
    FiBookmark,
    FiClock,
    FiEye,
    FiHeart,
    FiMessageCircle,
    FiShare2,
    FiSmile,
} from 'react-icons/fi';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import {
    useNewsDetails,
    formatRelativeDate,
    formatNewsDate,
} from '@feature/news';

// TODO: Refatorar esse componente, ele está muito grande e precisa ser dividido em subcomponentes menores para melhorar a legibilidade e manutenção. Talvez criar um componente específico para o leitor de capítulos, outro para a navegação entre capítulos e outro para os comentários.
const NewsDetails = () => {
    const { newsId } = useParams();

    const {
        news,
        commentSort,
        setCommentSort,
        showSpoilers,
        setShowSpoilers,
        readingProgress,
        relatedNews,
        sortedComments,
    } = useNewsDetails(newsId);

    if (!news) {
        return (
            <>
                <Header />
                <MainContent>
                    <section className="p-6 border rounded-xl border-tertiary bg-secondary">
                        <h1 className="text-2xl font-bold">
                            Notícia não encontrada
                        </h1>
                        <Link
                            to="/Manga-Reader/news"
                            className="inline-block mt-3 text-purple-300 underline"
                        >
                            Voltar para notícias
                        </Link>
                    </section>
                </MainContent>
                <Footer />
            </>
        );
    }

    return (
        <>
            <div
                className="fixed top-0 left-0 z-50 h-1 bg-purple-500"
                style={{ width: `${readingProgress}%` }}
            />
            <Header />
            <MainContent>
                <article className="space-y-5">
                    <header className="overflow-hidden border rounded-2xl border-tertiary bg-secondary">
                        <img
                            src={news.coverImage}
                            alt={news.title}
                            className="object-cover w-full aspect-[16/7]"
                        />
                        <div className="p-4 space-y-3">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="px-2 py-1 text-purple-200 rounded-full bg-purple-600/20">
                                    {news.category}
                                </span>
                                <span>{formatNewsDate(news.publishedAt)}</span>
                                <span className="inline-flex items-center gap-1">
                                    <FiClock /> {news.readTime} min
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <FiEye />{' '}
                                    {news.views.toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold">{news.title}</h1>
                            <p className="text-lg text-tertiary">
                                {news.subtitle}
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-primary">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={news.author.avatar}
                                        alt={news.author.name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <Link
                                            to={news.author.profileLink}
                                            className="font-medium underline"
                                        >
                                            {news.author.name}
                                        </Link>
                                        <p className="text-xs text-tertiary">
                                            {news.author.role}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm text-right text-tertiary">
                                    <p>{news.source}</p>
                                    {news.updatedAt && (
                                        <p>
                                            Atualizada{' '}
                                            {formatRelativeDate(news.updatedAt)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    <section className="grid gap-6 xl:grid-cols-3">
                        <div className="space-y-4 xl:col-span-2">
                            <div className="p-4 space-y-4 border rounded-xl border-tertiary bg-secondary">
                                {news.content.map((paragraph, index) => (
                                    <p
                                        key={paragraph}
                                        className="leading-8 text-justify"
                                    >
                                        {paragraph}
                                        {index === 1 && (
                                            <span className="block p-4 mt-4 italic border-l-4 rounded-r-lg border-purple-500 bg-primary">
                                                “{news.excerpt}”
                                            </span>
                                        )}
                                    </p>
                                ))}

                                <figure className="space-y-2">
                                    <img
                                        src={news.gallery[0]}
                                        alt="Imagem complementar"
                                        className="object-cover w-full rounded-lg"
                                    />
                                    <figcaption className="text-xs text-tertiary">
                                        Bastidores e materiais de divulgação da
                                        produção.
                                    </figcaption>
                                </figure>

                                {news.videoUrl && (
                                    <div className="overflow-hidden rounded-xl aspect-video">
                                        <iframe
                                            title="Vídeo incorporado"
                                            src={news.videoUrl}
                                            className="w-full h-full"
                                            allowFullScreen
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    {news.gallery.map(image => (
                                        <img
                                            key={image}
                                            src={image}
                                            alt="Galeria"
                                            className="object-cover w-full rounded-lg h-40"
                                        />
                                    ))}
                                </div>
                            </div>

                            {news.technicalSheet && (
                                <section className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                    <h2 className="text-xl font-semibold">
                                        Ficha técnica
                                    </h2>
                                    {Object.entries(news.technicalSheet).map(
                                        ([key, value]) => (
                                            <p key={key} className="text-sm">
                                                <strong>{key}:</strong> {value}
                                            </p>
                                        ),
                                    )}
                                </section>
                            )}

                            <section className="p-4 space-y-3 border rounded-xl border-tertiary bg-secondary">
                                <h2 className="text-xl font-semibold">
                                    Reações e engajamento
                                </h2>
                                <div className="flex flex-wrap gap-2 text-sm">
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded-full bg-primary"
                                    >
                                        👍 {news.reactions.like}
                                    </button>
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded-full bg-primary"
                                    >
                                        🤩 {news.reactions.excited}
                                    </button>
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded-full bg-primary"
                                    >
                                        😢 {news.reactions.sad}
                                    </button>
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded-full bg-primary"
                                    >
                                        😮 {news.reactions.surprised}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm text-tertiary">
                                    <span className="inline-flex items-center gap-1">
                                        <FiMessageCircle /> {news.commentsCount}{' '}
                                        comentários
                                    </span>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1"
                                    >
                                        <FiShare2 /> Compartilhar
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1"
                                    >
                                        <FiBookmark /> Salvar notícia
                                    </button>
                                </div>
                            </section>

                            <section className="p-4 space-y-3 border rounded-xl border-tertiary bg-secondary">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h2 className="text-xl font-semibold">
                                        Comentários
                                    </h2>
                                    <div className="flex gap-2">
                                        <select
                                            value={commentSort}
                                            onChange={event =>
                                                setCommentSort(
                                                    event.target
                                                        .value as typeof commentSort,
                                                )
                                            }
                                            className="px-2 py-1 text-sm border rounded-lg border-tertiary bg-secondary"
                                        >
                                            <option value="recent">
                                                Mais recentes
                                            </option>
                                            <option value="relevant">
                                                Mais relevantes
                                            </option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowSpoilers(value => !value)
                                            }
                                            className="px-3 py-1 text-sm rounded-lg bg-primary"
                                        >
                                            {showSpoilers
                                                ? 'Ocultar spoilers'
                                                : 'Mostrar spoilers'}
                                        </button>
                                    </div>
                                </div>

                                {sortedComments.map(comment => (
                                    <div
                                        key={comment.id}
                                        className="p-3 space-y-2 rounded-lg bg-primary"
                                    >
                                        <div className="flex items-center justify-between text-sm">
                                            <p className="font-semibold">
                                                {comment.user}
                                            </p>
                                            <p className="text-xs text-tertiary">
                                                {formatRelativeDate(
                                                    comment.createdAt,
                                                )}
                                            </p>
                                        </div>
                                        <p
                                            className={`text-sm ${
                                                comment.spoiler && !showSpoilers
                                                    ? 'blur-sm select-none'
                                                    : ''
                                            }`}
                                        >
                                            {comment.content}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-tertiary">
                                            <span className="inline-flex items-center gap-1">
                                                <FiHeart /> {comment.likes}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <FiSmile /> responder
                                            </span>
                                        </div>
                                        {comment.replies?.map(reply => (
                                            <div
                                                key={reply.id}
                                                className="p-2 ml-6 text-xs rounded-lg bg-secondary"
                                            >
                                                <strong>{reply.user}:</strong>{' '}
                                                {reply.content}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </section>
                        </div>

                        <aside className="space-y-4">
                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h3 className="font-semibold">
                                    Notícias relacionadas
                                </h3>
                                <div className="flex gap-3 overflow-x-auto xl:block xl:space-y-2">
                                    {relatedNews.map(item => (
                                        <Link
                                            key={item.id}
                                            to={`/Manga-Reader/news/${item.id}`}
                                            className="block min-w-56 rounded-lg bg-primary p-2 xl:min-w-0"
                                        >
                                            <p className="text-sm font-medium line-clamp-2">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-tertiary">
                                                {item.category} ·{' '}
                                                {formatRelativeDate(
                                                    item.publishedAt,
                                                )}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h3 className="font-semibold">Leia também</h3>
                                {relatedNews.slice(0, 4).map(item => (
                                    <Link
                                        key={`${item.id}-extra`}
                                        to={`/Manga-Reader/news/${item.id}`}
                                        className="block text-sm underline text-purple-300"
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        </aside>
                    </section>
                </article>
            </MainContent>

            <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed z-40 p-3 rounded-full shadow-lg bottom-6 right-6 bg-purple-600"
            >
                <FiArrowUp />
            </button>
            <Footer />
        </>
    );
};

export default NewsDetails;
