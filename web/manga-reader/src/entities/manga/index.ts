// Hooks
export { default as useTitle } from './model/useTitle';
export { default as useTitles } from './model/useTitles';
export { default as useTitlesFetch } from './model/data/useTitlesFetch';
export { default as useTitleModals } from './model/useTitleModals';
export { default as useSearchTitles } from './model/useSearchTitles';

// Components - Cards
export { default as MangaCard } from './ui/MangaCard';
export type { Manga, MangaCardProps } from './ui/MangaCard';
export { default as BaseCard } from './ui/card/base/BaseCard';
export { default as CarouselContainer } from './ui/card/carousel/CarouselContainer';
export { default as HighlightCardsContainer } from './ui/card/highlight/HighlightCardsContainer';
export { default as HorizontalCardsContainer } from './ui/card/horizontal/HorizontalCardsContainer';
export { default as VerticalCardsContainer } from './ui/card/vertical/VerticalCardsContainer';
export { default as VerticalCard } from './ui/card/vertical/VerticalCard';

// Components - Info & Actions
export { default as TitleInfoCard } from './ui/information/TitleInfoCard';
export { default as TitleDescription } from './ui/information/TitleDescription';
export { default as TitleActions } from './ui/action/TitleActions';

// Services
export { filterTitles, searchTitles } from './api/titleService';

// Types
export type { Title, AuthorRole, TitleAuthor, TitlePublisher } from './model/title.types';
export type {
    BaseCard as BaseCardProps,
    CarouselCard,
    HighlightCard as HighlightCardProps,
    VerticalCard as VerticalCardProps,
    HorizontalCard as HorizontalCardProps,
    TitleDetails as TitleDetailsProps,
} from './model/title-card.types';
export type { CardConfiguration } from './model/card-configuration.types';
export type { SectionHeader } from './model/section-header.types';
