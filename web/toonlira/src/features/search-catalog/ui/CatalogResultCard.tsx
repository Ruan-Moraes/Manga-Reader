import { ArrowUpRight, BookOpen, Building2, Palette, PenTool, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MangaPoster } from '@ui/MangaPoster';
import { SquareAvatar } from '@ui/SquareAvatar';

import type { GlobalSearchEntityType, GlobalSearchResult } from '../model/globalSearch.types';

const ICONS = {
    TITLE: BookOpen,
    AUTHOR: PenTool,
    ARTIST: Palette,
    PUBLISHER: Building2,
    GROUP: Users,
} satisfies Record<GlobalSearchEntityType, typeof BookOpen>;

type Props = {
    result: GlobalSearchResult;
    onOpen: () => void;
};

const CatalogResultCard = ({ result, onOpen }: Props) => {
    const { t } = useTranslation('manga');
    const Icon = ICONS[result.entityType];
    const metadata = [
        result.primaryContributor,
        result.country,
        result.workCount > 0 ? t('search.workCount', { count: result.workCount }) : null,
    ].filter(Boolean).join(' · ');
    const match = result.matchedBy !== 'PRIMARY_NAME' && result.matchedText
        ? t(`search.match.${result.matchedBy}`, { value: result.matchedText })
        : null;

    return (
        <button
            type="button"
            onClick={onOpen}
            className="group ui-focus-ring relative flex min-w-0 items-center gap-4 overflow-hidden rounded-ui-sm border border-ui-separator bg-ui-surface p-3 text-left shadow-sm motion-safe:transition-all motion-safe:duration-ui-default hover:-translate-y-0.5 hover:border-ui-accent-border hover:shadow-ui-elevated"
        >
            <span className="absolute inset-y-0 left-0 w-0.5 bg-ui-accent opacity-0 motion-safe:transition-opacity group-hover:opacity-100" />
            <span className="relative shrink-0 overflow-hidden rounded-ui-sm">
                {result.entityType === 'TITLE' ? (
                    <MangaPoster
                        cover={result.image ?? undefined}
                        alt={result.name}
                        size={64}
                        radius="sm"
                        className="[&_img]:motion-safe:transition-transform [&_img]:motion-safe:duration-ui-default group-hover:[&_img]:scale-105"
                    />
                ) : (
                    <SquareAvatar name={result.name} logo={result.image ?? undefined} size={64} />
                )}
                <span className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-ui-full bg-ui-overlay text-ui-on-overlay backdrop-blur-sm">
                    <Icon className="size-3" aria-hidden="true" />
                </span>
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-ui-small font-ui-extrabold text-ui-fg motion-safe:transition-colors group-hover:text-ui-accent-fg">
                    {result.name}
                </span>
                <span className="mt-1 block truncate text-ui-tiny font-ui-bold uppercase tracking-[0.08em] text-ui-accent-fg">
                    {t(`search.type.${result.entityType}`)}
                </span>
                {result.roles.length > 0 && (
                    <span className="mt-1 block truncate text-ui-tiny text-ui-fg-muted">
                        {result.roles.map(role => t(`search.role.${role}`)).join(' · ')}
                    </span>
                )}
                {metadata && <span className="mt-1 block truncate text-ui-tiny text-ui-fg-muted">{metadata}</span>}
                {match && <span className="mt-1 block truncate text-ui-tiny text-ui-accent-fg">{match}</span>}
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-ui-fg-muted opacity-50 motion-safe:transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ui-accent-fg group-hover:opacity-100" aria-hidden="true" />
        </button>
    );
};

export default CatalogResultCard;
