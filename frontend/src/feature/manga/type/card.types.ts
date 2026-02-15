import { Title } from './title.types';
import { StatusFetch } from '@shared/type/status-fetch.types';
import { CardConfiguration } from './card-configuration.types';

export type CarouselCard = Omit<
    Partial<Title>,
    | 'createdAt'
    | 'updatedAt'
    | 'type'
    | 'genres'
    | 'chapters'
    | 'popularity'
    | 'score'
    | 'author'
    | 'artist'
    | 'publisher'
> &
    StatusFetch;

export type HighlightCard = Omit<
    Partial<Title>,
    'createdAt' | 'updatedAt'
> &
    StatusFetch;

export type VerticalCard = Omit<
    Partial<Title>,
    | 'synopsis'
    | 'popularity'
    | 'score'
    | 'author'
    | 'artist'
    | 'publisher'
    | 'createdAt'
> &
    StatusFetch;

export type HorizontalCard = Omit<
    Partial<Title>,
    | 'synopsis'
    | 'popularity'
    | 'score'
    | 'author'
    | 'artist'
    | 'publisher'
    | 'createdAt'
    | 'updatedAt'
> &
    StatusFetch;

export type BaseCard = Omit<Title, 'createdAt' | 'updatedAt'> &
    CardConfiguration &
    Omit<StatusFetch, 'isError'>;

export type TitleDetails = Omit<
    Partial<Title>,
    'createdAt' | 'updatedAt' | 'cover' | 'synopsis' | 'genres'
> &
    CardConfiguration &
    Omit<StatusFetch, 'isError'>;
