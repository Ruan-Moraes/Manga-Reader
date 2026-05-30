import { useTranslation } from 'react-i18next';
import type { NewsItem } from '@feature/news';
import { Bookmark, MessageCircle, Share2 } from 'lucide-react';

type NewsArticleBodyProps = {
    news: NewsItem;
};

const NewsArticleBody = ({ news }: NewsArticleBodyProps) => {
    const { t } = useTranslation('news');

    return (
        <>
            <div className="p-4 space-y-4 border rounded-xl border-tertiary bg-secondary">
                {news.content.map((paragraph, index) => (
                    <p key={paragraph} className="leading-8 text-justify">
                        {paragraph}
                        {index === 1 && <span className="block p-4 mt-4 italic border-l-4 rounded-r-lg border-purple-500 bg-primary">“{news.excerpt}”</span>}
                    </p>
                ))}

                <figure className="space-y-2">
                    <img src={news.gallery[0]} alt={t('details.galleryAlt')} className="object-cover w-full rounded-lg" />
                    <figcaption className="text-xs text-tertiary">{t('details.galleryCaption')}</figcaption>
                </figure>

                {news.videoUrl && (
                    <div className="overflow-hidden rounded-xl aspect-video">
                        <iframe title={t('details.videoTitle')} src={news.videoUrl} className="w-full h-full" allowFullScreen />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    {news.gallery.map(image => (
                        <img key={image} src={image} alt={t('details.galleryImageAlt')} className="object-cover w-full rounded-lg h-40" />
                    ))}
                </div>
            </div>

            {news.technicalSheet && (
                <section className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                    <h2 className="text-xl font-semibold">{t('details.technicalSheet')}</h2>
                    {Object.entries(news.technicalSheet).map(([key, value]) => (
                        <p key={key} className="text-sm">
                            <strong>{key}:</strong> {value}
                        </p>
                    ))}
                </section>
            )}

            <section className="p-4 space-y-3 border rounded-xl border-tertiary bg-secondary">
                <h2 className="text-xl font-semibold">{t('details.reactions')}</h2>
                <div className="flex flex-wrap gap-2 text-sm">
                    <button type="button" className="px-3 py-1 rounded-full bg-primary">
                        👍 {news.reactions.like}
                    </button>
                    <button type="button" className="px-3 py-1 rounded-full bg-primary">
                        🤩 {news.reactions.excited}
                    </button>
                    <button type="button" className="px-3 py-1 rounded-full bg-primary">
                        😢 {news.reactions.sad}
                    </button>
                    <button type="button" className="px-3 py-1 rounded-full bg-primary">
                        😮 {news.reactions.surprised}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-tertiary">
                    <span className="inline-flex items-center gap-1">
                        <MessageCircle />{' '}
                        {t('details.commentsCount', {
                            count: news.commentsCount,
                        })}
                    </span>
                    <button type="button" className="inline-flex items-center gap-1">
                        <Share2 /> {t('details.share')}
                    </button>
                    <button type="button" className="inline-flex items-center gap-1">
                        <Bookmark /> {t('details.save')}
                    </button>
                </div>
            </section>
        </>
    );
};

export default NewsArticleBody;
