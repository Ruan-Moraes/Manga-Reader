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
        className={cn(
            'group flex cursor-pointer flex-col overflow-hidden rounded-mr-xs border border-mr-border bg-mr-surface transition-all duration-mr-default',
            'hover:-translate-y-0.5 hover:border-mr-accent-50',
        )}
    >
        <div
            className="h-[72px] w-full"
            style={{
                background: group.banner ?? 'linear-gradient(135deg, #2a1f3a, #161616)',
            }}
        />
        <div className="-mt-6 flex flex-col gap-3 p-4">
            <Avatar src={group.avatar} name={group.name} size={64} />
            <div>
                <h3 className="inline-flex items-center gap-1.5 text-mr-h4 font-mr-extrabold tracking-mr text-mr-fg">
                    {group.name}
                    {group.verified && <BadgeCheck className="size-4 text-mr-accent" aria-label="Grupo verificado" />}
                </h3>
                {group.handle && <div className="text-mr-tiny text-mr-fg-subtle">@{group.handle}</div>}
            </div>

            <div className="flex items-center gap-2 text-mr-tiny">
                <StatusDot status={statusKind[group.status]} />
                <span className="font-mr-bold uppercase tracking-[0.08em] text-mr-fg-muted">{statusLabel[group.status]}</span>
            </div>

            <div className="flex flex-wrap gap-4 text-mr-tiny text-mr-fg-muted">
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
                <div className="flex flex-wrap gap-1">
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
