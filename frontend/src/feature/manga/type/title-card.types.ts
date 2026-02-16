import { Title } from './title.types';
import { FetchStatus } from '@shared/type/fetch-status.types';
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
    FetchStatus;

export type HighlightCard = Omit<Partial<Title>, 'createdAt' | 'updatedAt'> &
    FetchStatus;

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
    FetchStatus;

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
    FetchStatus;

export type BaseCard = Omit<Title, 'createdAt' | 'updatedAt'> &
    CardConfiguration &
    Omit<FetchStatus, 'isError'>;

export type TitleDetails = Omit<
    Partial<Title>,
    'createdAt' | 'updatedAt' | 'cover' | 'synopsis' | 'genres'
> &
    CardConfiguration &
    Omit<FetchStatus, 'isError'>;
