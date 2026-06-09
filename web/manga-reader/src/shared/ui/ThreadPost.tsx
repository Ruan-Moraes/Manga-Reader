import type { ReactNode } from 'react';

import { PostShell } from '@ui/PostShell';
import { PostHeader } from '@ui/PostHeader';
import { ActionBar } from '@ui/ActionBar';

export interface ThreadPostProps {
    /** Âncora opcional para scroll/realce (ex.: `comment-<id>`). */
    anchorId?: string;

    // --- Shell (avatar + moldura) ---
    avatar: { src?: string; name: string };
    avatarSize?: number;
    onClickAvatar?: () => void;
    flat?: boolean;
    op?: boolean;
    highlighted?: boolean;
    replyingTo?: ReactNode;
    shellClassName?: string;

    // --- Header (nome · @handle · tempo · badges … right) ---
    name: string;
    handle?: string;
    time?: string;
    timeTitle?: string;
    onClickName?: () => void;
    nameProfileLabel?: string;
    badges?: ReactNode;
    headerRight?: ReactNode;

    // --- Corpo ---
    body: ReactNode;

    // --- Barra de ação ---
    vote?: ReactNode;
    onReply?: () => void;
    replyLabel?: string;
    /** Ações de dono (editar/excluir) ou extras. */
    actions?: ReactNode;

    /** Conteúdo extra dentro do shell (respostas, inputs inline). */
    children?: ReactNode;
}

/**
 * Estrutura canônica de post de discussão (comentário da obra e post do fórum).
 * Garante DOM + CSS idênticos entre os dois domínios: wrapper âncora → `PostShell`
 * → `PostHeader` + corpo + `ActionBar`. As diferenças de cada domínio entram por
 * slots (`badges`, `body`, `actions`, `children`).
 *
 * Resenhas (`ReviewCard`) seguem layout próprio (foco em rating) e não usam este shell.
 */
export const ThreadPost = ({
    anchorId,
    avatar,
    avatarSize,
    onClickAvatar,
    flat,
    op,
    highlighted,
    replyingTo,
    shellClassName,
    name,
    handle,
    time,
    timeTitle,
    onClickName,
    nameProfileLabel,
    badges,
    headerRight,
    body,
    vote,
    onReply,
    replyLabel,
    actions,
    children,
}: ThreadPostProps) => (
    <div id={anchorId}>
        <PostShell
            avatar={avatar}
            avatarSize={avatarSize}
            onClickAvatar={onClickAvatar}
            flat={flat}
            op={op}
            highlighted={highlighted}
            replyingTo={replyingTo}
            className={shellClassName}
        >
            <PostHeader
                name={name}
                handle={handle}
                time={time}
                timeTitle={timeTitle}
                onClickName={onClickName}
                nameProfileLabel={nameProfileLabel}
                badges={badges}
                right={headerRight}
                highlighted={highlighted}
            />
            {body}
            <ActionBar vote={vote} onReply={onReply} replyLabel={replyLabel} extra={actions} />
            {children}
        </PostShell>
    </div>
);

export default ThreadPost;
