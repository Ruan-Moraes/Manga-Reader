import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import SearchField from '@ui/SearchField';

import useGlobalSearch from '../model/useGlobalSearch';
import GlobalSearchDropdown from './GlobalSearchDropdown';

type Props = {
    onNavigate: (path: string) => void;
    showShortcut?: boolean;
};

const GlobalSearch = ({ onNavigate, showShortcut = true }: Props) => {
    const { t } = useTranslation('layout');
    const generatedId = useId();
    const listboxId = `global-search-listbox-${generatedId}`;
    const optionId = (index: number) => `${listboxId}-option-${index}`;
    const state = useGlobalSearch({ onNavigate });
    const activeDescendant = state.activeIndex >= 0 ? optionId(state.activeIndex) : undefined;
    const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
    const loading = state.queryReady && (state.search.isLoading || state.search.isFetching || state.search.isPlaceholderData);

    return (
        <div ref={state.containerRef} className="relative w-full">
            <SearchField
                ref={state.inputRef}
                value={state.value}
                onChange={state.setValue}
                onFocus={state.onFocus}
                onKeyDown={state.onKeyDown}
                placeholder={t('search.placeholder')}
                aria-label={t('search.ariaLabel')}
                clearAriaLabel={t('search.clearAria')}
                shortcut={showShortcut ? (isMac ? '⌘K' : 'Ctrl K') : undefined}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={state.open}
                aria-controls={listboxId}
                aria-activedescendant={activeDescendant}
            />
            <span className="sr-only" role="status" aria-live="polite">
                {loading
                    ? t('search.loadingAnnouncement')
                    : state.queryReady && state.search.data
                      ? t('search.resultsAnnouncement', { count: state.search.data.totalElements })
                      : ''}
            </span>
            {state.open && (
                <GlobalSearchDropdown
                    listboxId={listboxId}
                    optionId={optionId}
                    term={state.normalizedTerm}
                    queryReady={state.queryReady}
                    activeIndex={state.activeIndex}
                    options={state.options}
                    suggestionsLoading={state.suggestions.isLoading}
                    searchLoading={loading}
                    searchError={state.search.isError}
                    onRetry={() => void state.search.refetch()}
                    onActiveChange={state.setActiveIndex}
                    onSelect={state.selectOption}
                    onRemoveRecent={state.removeRecent}
                    onClearRecents={state.clearRecents}
                />
            )}
        </div>
    );
};

export default GlobalSearch;
