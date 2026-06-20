import { useTranslation } from 'react-i18next';

import { PAGE_GRADIENT } from '../../model/readerData';

interface ReaderPagePlaceholderProps {
    n: number;
    chapter: number;
    /** URL da página real; quando ausente, mostra o placeholder com gradiente. */
    src?: string;
}

/**
 * Placeholder de página com o carimbo discreto de capítulo. No app real, passe
 * `src` com a URL da imagem — o carimbo é mantido por cima.
 */
export const ReaderPagePlaceholder = ({ n, chapter, src }: ReaderPagePlaceholderProps) => {
    const { t } = useTranslation('manga');
    const pg = String(n).padStart(2, '0');

    return (
        <div className="reader-page" data-rd-page={n} style={src ? undefined : { background: PAGE_GRADIENT }} role="img" aria-label={t('reader.pageAria', { page: n, chNum: chapter })}>
            <div className="reader-page-stamp" aria-hidden="true">
                <span className="reader-page-stamp-ch">
                    {t('reader.chapterAbbr')} {chapter}
                </span>
                <span className="reader-page-stamp-sep" />
                <span>
                    {t('reader.pageStampPg')} {pg}
                </span>
            </div>
            {src ? <img className="reader-page-img" src={src} alt="" loading="lazy" /> : <div aria-hidden="true">{t('reader.pageStampPg')} {n}</div>}
        </div>
    );
};
