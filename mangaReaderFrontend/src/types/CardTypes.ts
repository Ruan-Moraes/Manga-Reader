import { TitleTypes } from './TitleTypes';
import { StatusFetchTypes } from './StatusFetchTypes';
import { CardConfigurationTypes } from './CardConfigurationTypes';

export type CarouselCardTypes = Omit<
    Partial<TitleTypes>,
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
    StatusFetchTypes;

export type HighlightCardTypes = Omit<
    Partial<TitleTypes>,
    'createdAt' | 'updatedAt'
> &
    StatusFetchTypes;

export type VerticalCardTypes = Omit<
    Partial<TitleTypes>,
    | 'synopsis'
    | 'popularity'
    | 'score'
    | 'author'
    | 'artist'
    | 'publisher'
    | 'createdAt'
> &
    StatusFetchTypes;

export type HorizontalCardTypes = Omit<
    Partial<TitleTypes>,
    | 'synopsis'
    | 'popularity'
    | 'score'
    | 'author'
    | 'artist'
    | 'publisher'
    | 'createdAt'
    | 'updatedAt'
> &
    StatusFetchTypes;

export type BaseCardTypes = Omit<TitleTypes, 'createdAt' | 'updatedAt'> &
    CardConfigurationTypes &
    Omit<StatusFetchTypes, 'isError'>;

export type TitleDetailsTypes = Omit<
    Partial<TitleTypes>,
    'createdAt' | 'updatedAt' | 'cover' | 'synopsis' | 'genres'
> &
    CardConfigurationTypes &
    Omit<StatusFetchTypes, 'isError'>;
