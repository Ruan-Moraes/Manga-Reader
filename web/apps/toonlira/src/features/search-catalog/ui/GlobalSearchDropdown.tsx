import { AlertCircle, BookOpen, Building2, ChevronRight, Palette, PenTool, Search, Sparkles, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@ui/Button';
import { Skeleton } from '@ui/Skeleton';

import type { GlobalSearchOption } from '../model/globalSearch.types';
import SearchResultItem from './SearchResultItem';
import RecentSearches, { RecentSearchControls } from './RecentSearches';

const SECTION_ICONS = {
    TITLE: BookOpen,
    AUTHOR: PenTool,
    ARTIST: Palette,
    PUBLISHER: Building2,
    GROUP: Users,
};

type Props = {
    listboxId: string;
    optionId: (index: number) => string;
    term: string;
    queryReady: boolean;
    activeIndex: number;
    options: GlobalSearchOption[];
    suggestionsLoading: boolean;
    searchLoading: boolean;
    searchError: boolean;
    onRetry: () => void;
    onActiveChange: (index: number) => void;
    onSelect: (option: GlobalSearchOption) => void;
    onRemoveRecent: (term: string) => void;
    onClearRecents: () => void;
};

const LoadingRows = () => (
    <div className="flex flex-col gap-2 p-2" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
                <Skeleton variant="rect" width={32} height={48} className="shrink-0 rounded-ui-sm" />
                <Skeleton variant="text" lines={2} className="flex-1" />
            </div>
        ))}
    </div>
);

const GlobalSearchDropdown = ({
    listboxId,
    optionId,
    term,
    queryReady,
    activeIndex,
    options,
    suggestionsLoading,
    searchLoading,
    searchError,
    onRetry,
    onActiveChange,
    onSelect,
    onRemoveRecent,
    onClearRecents,
}: Props) => {
    const { t } = useTranslation('layout');
    const suggestions = options.filter((option): option is Extract<GlobalSearchOption, { kind: 'suggestion' }> => option.kind === 'suggestion');
    const results = options.filter((option): option is Extract<GlobalSearchOption, { kind: 'result' }> => option.kind === 'result');
    const recents = options.filter((option): option is Extract<GlobalSearchOption, { kind: 'recent' }> => option.kind === 'recent');
    const viewAll = options.find((option): option is Extract<GlobalSearchOption, { kind: 'all' }> => option.kind === 'all');

    return (
        <div
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(72vh,580px)] overflow-y-auto rounded-ui-lg border border-ui-separator bg-ui-secondary p-2 shadow-ui-elevated motion-safe:origin-top motion-safe:transition-opacity max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-16"
        >
            {!term && (
                <>
                    <div className="flex items-center gap-2 px-2 pb-2 pt-2">
                        <span className="flex size-7 items-center justify-center rounded-ui-sm bg-ui-accent-10 text-ui-accent-fg">
                            <Sparkles className="size-3.5" aria-hidden="true" />
                        </span>
                        <h2 className="text-xs font-ui-extrabold uppercase tracking-widest text-ui-accent-fg">{t('search.suggestionsTitle')}</h2>
                    </div>
                    {suggestionsLoading && <LoadingRows />}
                </>
            )}
            <div
                id={listboxId}
                role="listbox"
                aria-label={t('search.resultsAria')}
                aria-busy={searchLoading}
            >
                {!term && !suggestionsLoading && (
                    <>
                        <div role="group" aria-label={t('search.suggestionsTitle')}>
                            {suggestions.map((option, index) => (
                                    <SearchResultItem
                                        key={option.title.id}
                                        id={optionId(index)}
                                        item={option.title}
                                        selected={activeIndex === index}
                                        onHover={() => onActiveChange(index)}
                                        onSelect={() => onSelect(option)}
                                    />
                            ))}
                        </div>
                        <RecentSearches
                            items={recents.map(option => option.term)}
                            optionOffset={suggestions.length}
                            activeIndex={activeIndex}
                            optionId={optionId}
                            onActiveChange={onActiveChange}
                            onSelect={termValue => {
                                const option = recents.find(item => item.term === termValue);
                                if (option) onSelect(option);
                            }}
                        />
                    </>
                )}
                {term && queryReady && !searchLoading && !searchError && results.length > 0 && (
                    <>
                        {[...new Set(results.map(option => option.sectionType))].map(sectionType => {
                            const Icon = SECTION_ICONS[sectionType];
                            return (
                            <div key={sectionType} role="group" aria-label={t(`search.type.${sectionType}`)} className="border-b border-ui-separator py-1 last:border-b-0">
                                <div className="flex items-center gap-2 px-2 pb-1 pt-2">
                                    <Icon className="size-3.5 text-ui-accent-fg" aria-hidden="true" />
                                    <h2 className="text-xs font-ui-extrabold uppercase tracking-widest text-ui-accent-fg">
                                        {t(`search.type.${sectionType}`)}
                                    </h2>
                                </div>
                                {results
                                    .filter(option => option.sectionType === sectionType)
                                    .map(option => {
                                        const index = options.indexOf(option);
                                        return (
                                            <SearchResultItem
                                                key={`${option.result.entityType}-${option.result.id}`}
                                                id={optionId(index)}
                                                item={option.result}
                                                selected={activeIndex === index}
                                                onHover={() => onActiveChange(index)}
                                                onSelect={() => onSelect(option)}
                                            />
                                        );
                                    })}
                            </div>
                            );
                        })}
                        {viewAll && (
                            <button
                                id={optionId(options.indexOf(viewAll))}
                                type="button"
                                role="option"
                                aria-selected={activeIndex === options.indexOf(viewAll)}
                                onMouseEnter={() => onActiveChange(options.indexOf(viewAll))}
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => onSelect(viewAll)}
                                className="group mt-2 flex w-full items-center justify-center gap-1.5 rounded-ui-sm border border-ui-accent-border bg-ui-accent-10 p-3 text-ui-small font-ui-bold text-ui-accent-fg motion-safe:transition-colors hover:bg-ui-accent-25"
                            >
                                {t('search.viewAll', { term })}
                                <ChevronRight className="size-3.5 motion-safe:transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                            </button>
                        )}
                    </>
                )}
            </div>
            {!term && (
                <RecentSearchControls
                    items={recents.map(option => option.term)}
                    onRemove={onRemoveRecent}
                    onClear={onClearRecents}
                />
            )}
            {term && term.length < 2 && <p className="p-4 text-center text-ui-small text-ui-fg-muted">{t('search.tooShort')}</p>}
            {term && term.length > 100 && <p className="p-4 text-center text-ui-small text-ui-fg-muted">{t('search.tooLong')}</p>}
            {term && term.length >= 2 && !queryReady && <LoadingRows />}
            {term && queryReady && searchLoading && <LoadingRows />}
            {term && queryReady && searchError && (
                <div className="flex flex-col items-center gap-3 p-5 text-center">
                    <AlertCircle className="size-5 text-ui-danger" aria-hidden="true" />
                    <p className="text-ui-small text-ui-fg-muted">{t('search.errorDescription')}</p>
                    <Button size="sm" variant="ghost" onClick={onRetry}>
                        {t('search.retry')}
                    </Button>
                </div>
            )}
            {term && queryReady && !searchLoading && !searchError && results.length === 0 && (
                <div className="flex flex-col items-center gap-2 p-5 text-center">
                    <Search className="size-5 text-ui-fg-muted" aria-hidden="true" />
                    <p className="text-ui-small text-ui-fg-muted">{t('search.noResults', { term })}</p>
                </div>
            )}
        </div>
    );
};

export default GlobalSearchDropdown;
