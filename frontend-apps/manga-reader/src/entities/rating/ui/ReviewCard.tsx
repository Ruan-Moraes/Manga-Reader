import type { ReactNode } from 'react';
import { ThumbsUp, MessageSquare, Star } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { Stars } from '@ui/Stars';
import { MangaPoster } from '@ui/MangaPoster';
import type { CommentAuthor } from '@ui/CommentBox';

export interface ReviewCardProps {
    author: CommentAuthor;
    when: string;
    rating: number;
    title?: string;
    children: ReactNode;
    manga?: { id: string; title: string; cover?: string; gradient?: string };
    upvotes: number;
    myVote?: 'up' | null;
    onVote?: () => void;
    badge?: 'top' | 'featured' | null;
    onClick?: () => void;
    comments?: number;
}

const badgeMap = {
    top: { label: 'Top review', variant: 'accent' as const },
    featured: { label: 'Em destaque', variant: 'neutral' as const },
};

export const ReviewCard = ({ author, when, rating, title, children, manga, upvotes, myVote, onVote, badge, onClick, comments }: ReviewCardProps) => (
    <article
        onClick={onClick}
        className={cn(
            'flex gap-4 rounded-mr-md border border-mr-border bg-mr-surface p-4',
            onClick && 'cursor-pointer transition-all hover:-translate-y-0.5 hover:border-mr-accent-50',
            badge === 'top' && 'border-mr-accent shadow-mr-elevated',
        )}
    >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
            <header className="flex flex-wrap items-center gap-2 text-mr-tiny text-mr-fg-subtle">
                <Avatar src={author.avatar} name={author.name} size={32} />
                <span className="text-mr-body font-mr-extrabold text-mr-fg">{author.name}</span>
                {author.badge && <Badge variant={author.badge === 'mod' ? 'danger' : 'accent'}>{author.badge}</Badge>}
                <span>·</span>
                <span>{when}</span>
                {badge && (
                    <Badge variant={badgeMap[badge].variant} icon={Star}>
                        {badgeMap[badge].label}
                    </Badge>
                )}
            </header>

            <div className="flex items-center gap-2">
                <Stars value={rating} size={18} />
                <span className="text-mr-h4 font-mr-extrabold tabular-nums text-mr-accent">{rating.toFixed(1)}</span>
            </div>

            {title && <h3 className="text-mr-h4 font-mr-extrabold tracking-mr text-mr-fg">{title}</h3>}

            <p className="line-clamp-4 text-mr-body leading-relaxed text-mr-fg-muted">{children}</p>

            <footer className="mt-1 flex items-center gap-4 text-mr-tiny">
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onVote?.();
                    }}
                    aria-pressed={myVote === 'up'}
                    className={cn('inline-flex items-center gap-1 font-mr-bold hover:text-mr-accent', myVote === 'up' ? 'text-mr-accent' : 'text-mr-fg-muted')}
                >
                    <ThumbsUp className="size-3.5" />
                    {upvotes}
                </button>
                {comments != null && (
                    <span className="inline-flex items-center gap-1 text-mr-fg-muted">
                        <MessageSquare className="size-3.5" />
                        {comments}
                    </span>
                )}
            </footer>
        </div>

        {manga && (
            <div className="hidden shrink-0 sm:block">
                <MangaPoster cover={manga.cover} fallbackGradient={manga.gradient} alt="" size={88} radius="sm" />
            </div>
        )}
    </article>
);

export default ReviewCard;
