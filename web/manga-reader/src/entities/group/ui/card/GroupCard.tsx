import { memo } from 'react';
import { BadgeCheck } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { StatusDot } from '@ui/StatusDot';

export interface GroupCardProps {
    group: {
        id: string;
        name: string;
        handle?: string;
        avatar?: string;
        banner?: string;
        status: 'active' | 'hiatus' | 'inactive';
        // Stats opcionais: fontes como GroupSummary (grupos seguidos — DT-48)
        // não trazem todos os contadores; o card omite os ausentes.
        members?: number;
        projects?: number;
        chaptersPublished?: number;
        tags?: string[];
        verified?: boolean;
    };
    onClick?: () => void;
    following?: boolean;
    onToggleFollow?: () => void;
    isLoading?: boolean;
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

const statusLabel = {
    active: 'Ativo',
    hiatus: 'Em hiato',
    inactive: 'Inativo',
};

const statusKind = {
    active: 'operating',
    hiatus: 'degraded',
    inactive: 'idle',
} as const;

const GroupCardBase = ({ group, onClick, following, onToggleFollow }: GroupCardProps) => (
    <article
        onClick={onClick}
        onKeyDown={event => {
            if (onClick && !onToggleFollow && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                onClick();
            }
        }}
        role={onClick && !onToggleFollow ? 'button' : undefined}
        tabIndex={onClick && !onToggleFollow ? 0 : undefined}
        className={cn(
            'group flex cursor-pointer flex-col overflow-hidden rounded-mr-md border border-mr-border bg-mr-surface transition-all duration-mr-default',
            'hover:-translate-y-0.5 hover:border-mr-accent-50 hover:shadow-mr-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mr-accent',
        )}
    >
        <div
            className="relative h-24 w-full bg-cover bg-center"
            style={{
                backgroundImage: group.banner ? `url(${group.banner})` : 'linear-gradient(135deg, var(--mr-accent-25), var(--mr-surface))',
            }}
        >
        </div>
        <div className="-mt-9 flex min-w-0 flex-col gap-3 p-4 pt-0">
            <div className="relative z-10 w-fit rounded-mr-md border-4 border-mr-surface bg-mr-surface">
                <Avatar src={group.avatar} name={group.name} size={64} />
            </div>

            <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="flex min-w-0 items-start gap-1.5 text-mr-h4 font-mr-extrabold leading-tight tracking-mr text-mr-fg">
                        <span className="line-clamp-2 break-words">{group.name}</span>
                        {group.verified && <BadgeCheck className="mt-0.5 size-4 shrink-0 text-mr-accent" aria-label="Grupo verificado" />}
                    </h3>
                    {group.handle && <div className="mt-1 truncate text-mr-tiny text-mr-fg-subtle">@{group.handle}</div>}
                </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-mr-full border border-mr-border-subtle bg-mr-surface-muted px-2.5 py-1 text-mr-tiny">
                <StatusDot status={statusKind[group.status]} />
                <span className="font-mr-bold uppercase tracking-[0.08em] text-mr-fg-muted">{statusLabel[group.status]}</span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-mr-border-subtle pt-3 text-mr-tiny text-mr-fg-muted">
                {group.members != null && (
                    <span>
                        <strong className="font-mr-extrabold text-mr-fg">{fmt(group.members)}</strong> seguidores
                    </span>
                )}
                {group.projects != null && (
                    <span>
                        <strong className="font-mr-extrabold text-mr-fg">{group.projects}</strong> obras
                    </span>
                )}
                {group.chaptersPublished != null && (
                    <span>
                        <strong className="font-mr-extrabold text-mr-fg">{fmt(group.chaptersPublished)}</strong> capítulos
                    </span>
                )}
            </div>

            {group.tags && group.tags.length > 0 && (
                <div className="flex min-h-6 flex-wrap gap-1">
                    {group.tags.map(t => (
                        <Badge key={t} variant="neutral">
                            {t}
                        </Badge>
                    ))}
                </div>
            )}

            {onToggleFollow && (
                <Button
                    variant={following ? 'ghost' : 'primary'}
                    block
                    aria-pressed={following}
                    onClick={e => {
                        e.stopPropagation();
                        onToggleFollow();
                    }}
                >
                    {following ? 'Seguindo' : 'Seguir grupo'}
                </Button>
            )}
        </div>
    </article>
);

export const GroupCard = memo(GroupCardBase);

export default GroupCard;
