import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

import { Avatar } from '@ui/Avatar';

export interface PostShellProps {
    avatar: { src?: string; name: string };
    avatarSize?: number;
    onClickAvatar?: () => void;
    flat?: boolean;
    op?: boolean;
    highlighted?: boolean;
    replyingTo?: ReactNode;
    children: ReactNode;
    className?: string;
}

/**
 * Anatomia canônica de post: avatar à esquerda + coluna de conteúdo.
 * Top-level vira card; respostas (`flat`) ficam sem moldura.
 */
export const PostShell = ({ avatar, avatarSize = 40, onClickAvatar, flat, op, highlighted, replyingTo, children, className }: PostShellProps) => (
    <div
        className={cn(
            'flex gap-2 md:gap-3',
            flat ? 'p-0 md:px-2 py-3' : 'rounded-mr-md border border-mr-border bg-mr-surface p-3 transition-colors hover:border-mr-border-subtle md:p-4',
            op && 'border-mr-accent-50 shadow-mr-elevated',
            highlighted && 'bg-mr-accent-25',
            className,
        )}
    >
        <Avatar src={avatar.src} name={avatar.name} size={avatarSize} onClick={onClickAvatar} />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
            {replyingTo}
            {children}
        </div>
    </div>
);

export default PostShell;
