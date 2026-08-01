import { useTranslation } from 'react-i18next';
import { ArrowUpRight, BookOpen, Building2, Palette, PenTool, Users } from 'lucide-react';

import type { Title } from '@entities/manga';
import { cn } from '@shared/lib/cn';
import { MangaPoster } from '@ui/MangaPoster';
import { SquareAvatar } from '@ui/SquareAvatar';

import type { GlobalSearchResult } from '../model/globalSearch.types';

const ICONS = {
    TITLE: BookOpen,
    AUTHOR: PenTool,
    ARTIST: Palette,
    PUBLISHER: Building2,
    GROUP: Users,
};

type Props = {
    item: Title | GlobalSearchResult;
    id: string;
    selected: boolean;
    onSelect: () => void;
    onHover: () => void;
};

const isGlobalResult = (item: Title | GlobalSearchResult): item is GlobalSearchResult => 'entityType' in item;

const SearchResultItem = ({ item, id, selected, onSelect, onHover }: Props) => {
    const { t } = useTranslation('layout');
    const result = isGlobalResult(item) ? item : null;
    const isTitle = !result || result.entityType === 'TITLE';
    const legacyTitle = isGlobalResult(item) ? null : item;
    const image = result?.image ?? legacyTitle?.cover;
    const secondary = result
        ? [
              t(`search.type.${result.entityType}`),
              result.primaryContributor,
              result.country,
              result.workCount > 0 ? t('search.workCount', { count: result.workCount }) : null,
          ]
              .filter(Boolean)
              .join(' · ')
        : [
              legacyTitle?.type,
              legacyTitle?.status,
              legacyTitle?.chaptersCount != null
                  ? t('search.chapterCount', { count: legacyTitle.chaptersCount })
                  : null,
          ]
              .filter(Boolean)
              .join(' · ');
    const matchLabel =
        result && result.matchedBy !== 'PRIMARY_NAME'
            ? t(`search.match.${result.matchedBy}`, { value: result.matchedText })
            : null;
    const Icon = result ? ICONS[result.entityType] : BookOpen;

    return (
        <button
            id={id}
            type="button"
            role="option"
            aria-selected={selected}
            onMouseEnter={onHover}
            onMouseDown={event => event.preventDefault()}
            onClick={onSelect}
            className={cn(
                'group relative flex w-full items-center gap-3 overflow-hidden rounded-mr-xs border p-2.5 text-left motion-safe:transition-all motion-safe:duration-mr-default',
                selected ? 'border-mr-accent-border bg-mr-accent-25 shadow-sm' : 'border-transparent hover:border-mr-separator hover:bg-mr-accent-10',
            )}
        >
            <span className={cn('absolute inset-y-2 left-0 w-0.5 rounded-mr-full bg-mr-accent motion-safe:transition-opacity', selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} />
            <span className="relative w-10 shrink-0 overflow-hidden rounded-mr-sm">
                {isTitle ? (
                    <MangaPoster
                        cover={image ?? undefined}
                        alt={t('search.coverAlt', { title: item.name })}
                        size={40}
                        radius="sm"
                        className="[&_img]:motion-safe:transition-transform [&_img]:motion-safe:duration-mr-default group-hover:[&_img]:scale-105"
                    />
                ) : (
                    <SquareAvatar name={item.name} logo={image ?? undefined} size={40} />
                )}
                <span className="absolute bottom-0 right-0 flex size-4 items-center justify-center rounded-mr-full bg-mr-overlay text-mr-on-overlay">
                    <Icon className="size-2.5" aria-hidden="true" />
                </span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-mr-small font-mr-bold text-mr-fg">{item.name}</span>
                {result && result.roles.length > 0 && (
                    <span className="truncate text-xs text-mr-accent-fg">
                        {result.roles.map(role => t(`search.role.${role}`)).join(' · ')}
                    </span>
                )}
                {secondary && <span className="mt-0.5 truncate text-xs text-mr-fg-muted">{secondary}</span>}
                {matchLabel && <span className="mt-0.5 truncate text-xs text-mr-accent-fg">{matchLabel}</span>}
            </span>
            <ArrowUpRight className={cn('size-3.5 shrink-0 text-mr-accent-fg motion-safe:transition-all', selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} aria-hidden="true" />
        </button>
    );
};

export default SearchResultItem;
