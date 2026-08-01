import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';

type Props = {
    items: string[];
    optionOffset: number;
    activeIndex: number;
    optionId: (index: number) => string;
    onActiveChange: (index: number) => void;
    onSelect: (term: string) => void;
};

const RecentSearches = ({ items, optionOffset, activeIndex, optionId, onActiveChange, onSelect }: Props) => {
    const { t } = useTranslation('layout');
    if (items.length === 0) return null;

    return (
        <div role="group" aria-label={t('search.recentTitle')}>
            {items.map((term, itemIndex) => {
                const index = optionOffset + itemIndex;
                const selected = activeIndex === index;
                return (
                    <button
                        key={term}
                        id={optionId(index)}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => onActiveChange(index)}
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => onSelect(term)}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-mr-xs p-2 text-left text-mr-small text-mr-fg-muted',
                            selected ? 'bg-mr-accent-25' : 'hover:bg-mr-accent-25',
                        )}
                    >
                        <Search className="size-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{term}</span>
                    </button>
                );
            })}
        </div>
    );
};

type RecentControlsProps = {
    items: string[];
    onRemove: (term: string) => void;
    onClear: () => void;
};

export const RecentSearchControls = ({ items, onRemove, onClear }: RecentControlsProps) => {
    const { t } = useTranslation('layout');
    if (items.length === 0) return null;

    return (
        <section className="mt-2 border-t border-mr-separator pt-2">
            <div className="flex items-center justify-between px-2 pb-1">
                <h2 className="text-xs font-mr-extrabold uppercase tracking-widest text-mr-accent-fg">{t('search.recentTitle')}</h2>
                <button type="button" onClick={onClear} className="rounded-mr-xs px-2 py-1 text-xs text-mr-fg-muted hover:bg-mr-accent-25 hover:text-mr-fg">
                    {t('search.clearRecent')}
                </button>
            </div>
            <div className="flex flex-wrap gap-1 px-2">
                {items.map(term => (
                    <button
                        key={term}
                        type="button"
                        aria-label={t('search.removeRecentAria', { term })}
                        onClick={() => onRemove(term)}
                        className="mr-focus-ring inline-flex max-w-full items-center gap-1 rounded-mr-full bg-mr-accent-25 px-2 py-1 text-xs text-mr-fg-muted hover:text-mr-fg"
                    >
                        <span className="truncate">{term}</span>
                        <X className="size-3 shrink-0" aria-hidden="true" />
                    </button>
                ))}
            </div>
        </section>
    );
};

export default RecentSearches;
