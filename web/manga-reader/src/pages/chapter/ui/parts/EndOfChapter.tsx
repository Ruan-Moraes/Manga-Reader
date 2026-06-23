import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, Library, MessagesSquare, Star } from 'lucide-react';

import { illustrationUrl } from '@shared/lib/illustrations';

interface EndOfChapterProps {
    chapter: number;
    rating: number;
    onRate: (n: number) => void;
    ratingAverage: number;
    ratingCount: number;
    onNext: () => void;
    onBack: () => void;
    onForum: () => void;
}

export const EndOfChapter = ({ chapter, rating, onRate, ratingAverage, ratingCount, onNext, onBack, onForum }: EndOfChapterProps) => {
    const { t } = useTranslation('manga');
    const feliz = illustrationUrl('feliz');

    return (
        <section className="reader-end">
            <div className="reader-end-top">
                {feliz && <img src={feliz} alt="" aria-hidden="true" />}
                <div className="reader-end-eyebrow">
                    <Check size={12} strokeWidth={2} />
                    {t('reader.endEyebrow', { chapter })}
                </div>
                <h2 className="reader-end-title">{t('reader.endTitle', { chapter })}</h2>
                <p className="reader-end-sub">
                    {t('reader.endSubBefore')} <strong>{t('reader.endSubReaders', { count: 3241 })}</strong> {t('reader.endSubAfter')}
                </p>
            </div>

            <div className="reader-end-rate">
                <div className="reader-opt-label">{t('reader.howWas')}</div>
                <div className="reader-end-rate-row">
                    {[1, 2, 3, 4, 5].map(n => (
                        <button
                            key={n}
                            type="button"
                            className={`reader-rate-btn ${rating >= n ? 'active' : ''}`}
                            onClick={() => onRate(rating === n ? 0 : n)}
                            aria-label={t('reader.rateStarAria', { n })}
                        >
                            <Star size={18} strokeWidth={2} fill={rating >= n ? 'currentColor' : 'none'} />
                        </button>
                    ))}
                    <span className="reader-rate-stat">
                        {t('reader.communityAvgPre')} <strong>{ratingAverage.toFixed(1)}</strong> {t('reader.communityAvgVotes', { votes: ratingCount.toLocaleString('pt-BR') })}
                    </span>
                </div>
            </div>

            <div className="reader-end-nav">
                <button type="button" className="reader-end-nav-card primary" onClick={onNext}>
                    <div className="reader-end-nav-icon">
                        <ArrowRight size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <div className="reader-end-nav-label">{t('reader.navNextLabel')}</div>
                        <div className="reader-end-nav-title">{t('reader.navNextTitle', { chapter: chapter + 1 })}</div>
                    </div>
                </button>
                <button type="button" className="reader-end-nav-card" onClick={onBack}>
                    <div className="reader-end-nav-icon">
                        <Library size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <div className="reader-end-nav-label">{t('reader.navBackLabel')}</div>
                        <div className="reader-end-nav-title">{t('reader.navBackTitle')}</div>
                    </div>
                </button>
                <button type="button" className="reader-end-nav-card" onClick={onForum}>
                    <div className="reader-end-nav-icon">
                        <MessagesSquare size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <div className="reader-end-nav-label">{t('reader.navForumLabel')}</div>
                        <div className="reader-end-nav-title">{t('reader.navForumTitle', { count: 847 })}</div>
                    </div>
                </button>
            </div>
        </section>
    );
};
