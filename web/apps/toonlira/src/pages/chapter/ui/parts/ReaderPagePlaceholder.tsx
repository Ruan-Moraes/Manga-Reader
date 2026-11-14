import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageOff, RotateCw } from 'lucide-react';
import type { ImageQuality } from '@entities/user';

import { PAGE_GRADIENT } from '../../model/readerData';

interface ReaderPagePlaceholderProps {
    n: number;
    chapter: number;
    /** URL da página real; quando ausente, mostra o placeholder com gradiente. */
    src?: string;
    eager?: boolean;
    quality: ImageQuality;
    edge?: 'first' | 'last' | 'both';
}

/**
 * Página do leitor: imagem real (com lazy loading, estado de erro e retry
 * por página) quando `src` existe; placeholder com gradiente caso contrário.
 */
export const ReaderPagePlaceholder = ({ n, chapter, src, eager = false, quality, edge }: ReaderPagePlaceholderProps) => {
    const { t } = useTranslation('manga');
    const [failed, setFailed] = useState(false);
    // Cache-buster incrementado a cada retry para forçar novo request da imagem.
    const [attempt, setAttempt] = useState(0);
    const pg = String(n).padStart(2, '0');

    // A instância é reutilizada entre capítulos (key = número da página):
    // erro de uma imagem não pode "vazar" para a src seguinte.
    useEffect(() => {
        setFailed(false);
        setAttempt(0);
    }, [src]);

    const retry = () => {
        setFailed(false);
        setAttempt(a => a + 1);
    };

    const showImage = src && !failed;
    const imageSrc = src && attempt > 0 ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}` : src;

    return (
        <div className="reader-page" data-rd-page={n} data-rd-edge={edge} data-quality={quality.toLowerCase()} style={showImage ? undefined : { background: PAGE_GRADIENT }} role="img" aria-label={t('reader.pageAria', { page: n, chNum: chapter })}>
            <div className="reader-page-stamp" aria-hidden="true">
                <span className="reader-page-stamp-ch">
                    {t('reader.chapterAbbr')} {chapter}
                </span>
                <span className="reader-page-stamp-sep" />
                <span>
                    {t('reader.pageStampPg')} {pg}
                </span>
            </div>
            {showImage ? (
                <img className="reader-page-img" src={imageSrc} alt="" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} onError={() => setFailed(true)} />
            ) : src && failed ? (
                <div className="flex flex-col items-center gap-2.5 py-16 text-ui-fg-muted">
                    <ImageOff size={22} aria-hidden="true" />
                    <span className="text-ui-small">{t('reader.pageError', { page: n })}</span>
                    <button
                        type="button"
                        onClick={retry}
                        className="inline-flex items-center gap-1.5 rounded-ui-xs border border-ui-border px-3 py-1.5 text-ui-tiny font-ui-bold text-ui-fg transition-colors hover:border-ui-accent-50 hover:text-ui-accent-fg"
                    >
                        <RotateCw size={12} aria-hidden="true" /> {t('reader.retryPage')}
                    </button>
                </div>
            ) : (
                <div aria-hidden="true">
                    {t('reader.pageStampPg')} {n}
                </div>
            )}
        </div>
    );
};
