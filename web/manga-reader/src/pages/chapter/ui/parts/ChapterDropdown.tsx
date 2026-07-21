import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownAZ, ArrowDownZA, Search, X } from 'lucide-react';

import { Badge } from '@ui/Badge';

export interface ChapterListItem {
    num: number;
    title: string;
    when: string;
    isCurrent: boolean;
}

interface ChapterDropdownProps {
    list: ChapterListItem[];
    onPick: (num: number) => void;
    onClose: () => void;
}

export const ChapterDropdown = ({ list, onPick, onClose }: ChapterDropdownProps) => {
    const { t } = useTranslation('manga');
    const [q, setQ] = useState('');
    const [asc, setAsc] = useState(false);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        return list
            .filter(c => !term || String(c.num).includes(term) || c.title.toLowerCase().includes(term))
            .sort((a, b) => (asc ? a.num - b.num : b.num - a.num));
    }, [list, q, asc]);

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 20 }} aria-hidden="true" />
            <div className="reader-chapters-pop" role="dialog" aria-label={t('reader.chaptersTitle')}>
                <header className="reader-chapters-head">
                    <span>{t('reader.chaptersTitle')}</span>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'transparent', border: 0, color: 'var(--mr-fg-subtle)', cursor: 'pointer', display: 'inline-flex' }}
                        aria-label={t('reader.closeAria')}
                    >
                        <X size={14} strokeWidth={2} />
                    </button>
                </header>

                <div className="reader-chapters-tools">
                    <div className="reader-chapters-search">
                        <Search size={14} strokeWidth={2} aria-hidden="true" />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('reader.searchPlaceholder')} aria-label={t('reader.searchAria')} />
                        {q && (
                            <button type="button" onClick={() => setQ('')} aria-label={t('reader.clearAria')}>
                                <X size={12} strokeWidth={2} />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        className="reader-chapters-sort"
                        onClick={() => setAsc(v => !v)}
                        aria-label={t('reader.sortAria')}
                        title={asc ? t('reader.sortAscTitle') : t('reader.sortDescTitle')}
                    >
                        {asc ? <ArrowDownAZ size={14} strokeWidth={2} /> : <ArrowDownZA size={14} strokeWidth={2} />}
                        <span>{asc ? t('reader.sortAsc') : t('reader.sortDesc')}</span>
                    </button>
                </div>

                <div className="reader-chapters-list">
                    {filtered.length === 0 && <div className="reader-chapters-empty">{t('reader.chaptersEmpty', { q })}</div>}
                    {filtered.map(c => (
                        <button key={c.num} type="button" className={`reader-chapter-item ${c.isCurrent ? 'active' : ''}`} onClick={() => onPick(c.num)}>
                            <span className="reader-chapter-num">#{c.num}</span>
                            <span className="reader-chapter-title">{c.title}</span>
                            <span className="reader-chapter-meta">
                                <span>{c.when}</span>
                                {c.isCurrent && <Badge>{t('reader.reading')}</Badge>}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};
