import { ChevronUp, ChevronDown } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Stars } from './Stars';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export interface CommentAuthor {
    name: string;
    handle?: string;
    avatar?: string;
    badge?: 'author' | 'mod' | 'verified' | string;
}

export interface CommentBoxProps {
    author: CommentAuthor;
    when: string;
    children: ReactNode;
    upvotes?: number;
    downvotes?: number;
    myVote?: 'up' | 'down' | null;
    onVote?: (vote: 'up' | 'down') => void;
    highlighted?: boolean;
    replyTo?: { name: string; preview: string };
    actions?: ReactNode;
    rating?: number;
    replies?: ReactNode;
}

const badgeVariant = (badge: string): 'accent' | 'danger' | 'neutral' => (badge === 'mod' ? 'danger' : badge === 'author' ? 'accent' : 'neutral');

export const CommentBox = ({
    author,
    when,
    children,
    upvotes = 0,
    downvotes = 0,
    myVote,
    onVote,
    highlighted,
    replyTo,
    actions,
    rating,
    replies,
}: CommentBoxProps) => (
    <article className={cn('flex gap-3 rounded-mr-md border bg-mr-surface p-4', highlighted ? 'border-mr-accent bg-mr-accent-25/50' : 'border-mr-border')}>
        <Avatar src={author.avatar} name={author.name} size={40} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
            <header className="flex flex-wrap items-center gap-2 text-mr-tiny text-mr-fg-subtle">
                <span className="text-mr-body font-mr-extrabold text-mr-fg">{author.name}</span>
                {author.handle && <span>@{author.handle}</span>}
                {author.badge && <Badge variant={badgeVariant(author.badge)}>{author.badge}</Badge>}
                <span>·</span>
                <span>{when}</span>
            </header>

            {replyTo && (
                <blockquote className="rounded-mr-xs border-l-[3px] border-mr-accent bg-mr-surface-muted p-2 text-mr-tiny text-mr-fg-muted">
                    <strong>@{replyTo.name}:</strong> {replyTo.preview}
                </blockquote>
            )}

            {rating != null && <Stars value={rating} size={14} />}

            <div className="text-mr-body leading-relaxed text-mr-fg-muted">{children}</div>

            <footer className="flex flex-wrap items-center gap-3 text-mr-tiny">
                <div className="inline-flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={() => onVote?.('up')}
                        aria-pressed={myVote === 'up'}
                        aria-label="Curtir"
                        className={cn(
                            'flex size-7 items-center justify-center rounded-mr-xs hover:bg-mr-accent-25',
                            myVote === 'up' && 'bg-mr-accent-25 text-mr-accent',
                        )}
                    >
                        <ChevronUp className="size-4" />
                    </button>
                    <span className="min-w-6 text-center font-mr-bold tabular-nums text-mr-fg">{upvotes - downvotes}</span>
                    <button
                        type="button"
                        onClick={() => onVote?.('down')}
                        aria-pressed={myVote === 'down'}
                        aria-label="Descurtir"
                        className={cn(
                            'flex size-7 items-center justify-center rounded-mr-xs hover:bg-[rgba(255,120,79,.1)]',
                            myVote === 'down' && 'text-mr-danger',
                        )}
                    >
                        <ChevronDown className="size-4" />
                    </button>
                </div>
                {actions}
            </footer>

            {replies && <div className="ml-4 mt-2 flex flex-col gap-3 border-l-2 border-mr-accent-25 pl-4">{replies}</div>}
        </div>
    </article>
);

export default CommentBox;
