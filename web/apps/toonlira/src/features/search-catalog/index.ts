export { default as GlobalSearch } from './ui/GlobalSearch';
export { default as CatalogResultCard } from './ui/CatalogResultCard';
export { useCatalogSearch, useGlobalSearchSuggestions } from './model/useCatalogSearch';
export { getGlobalSearchSuggestions, searchCatalog } from './api/globalSearchService';
export type {
    GlobalSearchEntityType,
    GlobalSearchMatchType,
    GlobalSearchOption,
    GlobalSearchResult,
    GlobalSearchSection,
    GlobalSearchSuggestions,
} from './model/globalSearch.types';
