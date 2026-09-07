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
                'group ui-focus-ring block min-w-0 rounded-ui-sm text-left motion-safe:transition-transform motion-safe:duration-ui-default motion-safe:hover:-translate-y-1',
                className,
            )}
        >
            <span className="relative block overflow-hidden rounded-ui-sm bg-ui-surface shadow-sm motion-safe:transition-shadow motion-safe:duration-ui-default group-hover:shadow-ui-elevated">
                <MangaPoster
                    cover={work.cover ?? undefined}
                    alt={work.name}
                    size={320}
                    radius="lg"
                    className="w-full border-ui-border [&_img]:motion-safe:transition-transform [&_img]:motion-safe:duration-ui-slow group-hover:[&_img]:scale-[1.04]"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ui-overlay-strong to-transparent opacity-0 motion-safe:transition-opacity motion-safe:duration-ui-default group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-2 right-2 flex size-8 translate-y-2 items-center justify-center rounded-ui-full bg-ui-accent text-ui-on-accent opacity-0 shadow-ui-elevated motion-safe:transition-all motion-safe:duration-ui-default group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
            </span>
            <span className="mt-2.5 block line-clamp-2 text-ui-small font-ui-extrabold leading-snug text-ui-fg motion-safe:transition-colors group-hover:text-ui-accent-fg">
                {work.name}
            </span>
            {(work.type || work.status) && (
                <span className="mt-1 block truncate text-ui-tiny text-ui-fg-muted">
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
