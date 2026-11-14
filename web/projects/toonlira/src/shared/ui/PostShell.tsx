import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

import { Avatar } from '@ui/Avatar';

export interface PostShellProps {
    /** Quando ausente, nenhuma coluna de avatar é reservada — conteúdo ocupa a largura toda. */
    avatar?: { src?: string; name: string };
    avatarSize?: number;
    onClickAvatar?: () => void;
    flat?: boolean;
    op?: boolean;
    highlighted?: boolean;
    replyingTo?: ReactNode;
    children: ReactNode;
    className?: string;
}

export const PostShell = ({ avatar, avatarSize = 40, onClickAvatar, flat, op, highlighted, replyingTo, children, className }: PostShellProps) => (
    <div
        className={cn(
            'flex gap-3 md:gap-[14px]',
            flat ? 'p-2' : 'rounded-ui-xs border border-ui-border bg-ui-surface p-[14px] transition-colors hover:border-ui-border-subtle md:p-[18px]',
            op && 'border-ui-accent-50 shadow-ui-elevated',
            highlighted && 'bg-ui-accent-25',
            className,
        )}
    >
        {avatar && <Avatar src={avatar.src} name={avatar.name} size={avatarSize} onClick={onClickAvatar} />}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            {replyingTo}
            {children}
        </div>
    </div>
);

export default PostShell;
