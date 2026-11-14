import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReaderRailsProps {
    direction: 'ltr' | 'rtl';
    onNext: () => void;
    onPrev: () => void;
}

/** Zonas clicáveis laterais — só desktop ≥1024, modos paginado/dupla (via CSS). */
export const ReaderRails = ({ onNext, onPrev }: ReaderRailsProps) => {
    const { t } = useTranslation('manga');

    return (
        <div className="reader-rails">
            <button type="button" className="reader-rail left" onClick={onPrev} aria-label={t('reader.prevPageAria')}>
                <span className="reader-rail-arrow">
                    <ChevronLeft size={28} strokeWidth={2} />
                </span>
            </button>
            <button type="button" className="reader-rail right" onClick={onNext} aria-label={t('reader.nextPageAria')}>
                <span className="reader-rail-arrow">
                    <ChevronRight size={28} strokeWidth={2} />
                </span>
            </button>
        </div>
    );
};
