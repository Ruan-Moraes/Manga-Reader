import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';
import { Badge } from '@ui/Badge';
import { MangaPoster } from '@ui/MangaPoster';

import type { RelatedTitle } from '../../model/title.types';

type Props = {
    work: RelatedTitle;
    onOpen: () => void;
    showRoles?: boolean;
    className?: string;
};

const RelatedWorkCard = ({ work, onOpen, showRoles = false, className }: Props) => {
    const { t } = useTranslation('manga');

    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(
                'group mr-focus-ring block min-w-0 rounded-mr-sm text-left motion-safe:transition-transform motion-safe:duration-mr-default motion-safe:hover:-translate-y-1',
                className,
            )}
        >
            <span className="relative block overflow-hidden rounded-mr-sm bg-mr-surface shadow-sm motion-safe:transition-shadow motion-safe:duration-mr-default group-hover:shadow-mr-elevated">
                <MangaPoster
                    cover={work.cover ?? undefined}
                    alt={work.name}
                    size={320}
                    radius="lg"
                    className="w-full border-mr-border [&_img]:motion-safe:transition-transform [&_img]:motion-safe:duration-mr-slow group-hover:[&_img]:scale-[1.04]"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-mr-overlay-strong to-transparent opacity-0 motion-safe:transition-opacity motion-safe:duration-mr-default group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-2 right-2 flex size-8 translate-y-2 items-center justify-center rounded-mr-full bg-mr-accent text-mr-on-accent opacity-0 shadow-mr-elevated motion-safe:transition-all motion-safe:duration-mr-default group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
            </span>
            <span className="mt-2.5 block line-clamp-2 text-mr-small font-mr-extrabold leading-snug text-mr-fg motion-safe:transition-colors group-hover:text-mr-accent-fg">
                {work.name}
            </span>
            {(work.type || work.status) && (
                <span className="mt-1 block truncate text-mr-tiny text-mr-fg-muted">
                    {[work.type, work.status].filter(Boolean).join(' · ')}
                </span>
            )}
            {showRoles && work.roles.length > 0 && (
                <span className="mt-2 flex flex-wrap gap-1">
                    {work.roles.map(role => <Badge key={role} variant="neutral">{t(`search.role.${role}`)}</Badge>)}
                </span>
            )}
        </button>
    );
};

export default RelatedWorkCard;
