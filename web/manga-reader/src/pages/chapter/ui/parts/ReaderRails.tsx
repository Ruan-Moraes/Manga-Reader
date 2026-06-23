import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { Direction } from '../../model/useChapterReader';

interface ReaderRailsProps {
    direction: Direction;
    onNext: () => void;
    onPrev: () => void;
}

/** Zonas clicáveis laterais — só desktop ≥1024, modos paginado/dupla (via CSS). */
export const ReaderRails = ({ direction, onNext, onPrev }: ReaderRailsProps) => {
    const { t } = useTranslation('manga');
    const rtl = direction === 'rtl';

    return (
        <div className="reader-rails">
            <button type="button" className="reader-rail left" onClick={rtl ? onNext : onPrev} aria-label={t('reader.prevPageAria')}>
                <span className="reader-rail-arrow">
                    <ChevronLeft size={28} strokeWidth={2} />
                </span>
            </button>
            <button type="button" className="reader-rail right" onClick={rtl ? onPrev : onNext} aria-label={t('reader.nextPageAria')}>
                <span className="reader-rail-arrow">
                    <ChevronRight size={28} strokeWidth={2} />
                </span>
            </button>
        </div>
    );
};
