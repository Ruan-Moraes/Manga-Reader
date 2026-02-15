// Hooks
export { default as useTitle } from './hook/useTitle';
export { default as useTitles } from './hook/useTitles';
export { default as useTitlesFetch } from './hook/data/useTitlesFetch';

// Components - Cards
export { default as BaseCard } from './component/card/base/Card';
export { default as CarouselContainer } from './component/card/carousel/CarouselContainer';
export { default as HighlightCardsContainer } from './component/card/highlight/CardsContainer';
export { default as HorizontalCardsContainer } from './component/card/horizontal/CardsContainer';
export { default as VerticalCardsContainer } from './component/card/vertical/CardsContainer';

// Components - Info & Actions
export { default as TitleDetails } from './component/information/TitleDetails';
export { default as TitleDescription } from './component/information/TitleDescription';
export { default as TitleActions } from './component/action/TitleActions';

// Types
export type { Title } from './type/title.types';
export type { BaseCard, CarouselCard, HighlightCard, VerticalCard, HorizontalCard, TitleDetails } from './type/card.types';
export type { CardConfiguration } from './type/card-configuration.types';
export type { CardsContainer } from './type/card-container.types';
