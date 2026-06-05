import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export interface PostHeaderProps {
    name: string;
    /** @handle opcional (omitido em comentários sem username). */
    handle?: string;
    /** Tempo relativo já formatado (ex.: "há 2 horas"). */
    time?: string;
    onClickName?: () => void;
    nameProfileLabel?: string;
    /** Chips após o tempo: papel (AUTOR/MOD), membro, "editado"… */
    badges?: ReactNode;
    /** Slot à direita: nota+estrelas (resenha), etc. */
    right?: ReactNode;
    highlighted?: boolean;
}

/**
 * Cabeçalho canônico de post: nome · @handle · • · tempo · <badges> … <right>.
 * Funde o que antes vivia separado em CommentUser + CommentMetadata.
 */
export const PostHeader = ({ name, handle, time, onClickName, nameProfileLabel, badges, right, highlighted }: PostHeaderProps) => {
    const interactive = !!onClickName;
    const NameTag = interactive ? 'button' : 'span';

    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <NameTag
                onClick={interactive ? onClickName : undefined}
                aria-label={interactive ? nameProfileLabel : undefined}
                className={cn(
                    'truncate text-mr-body font-mr-extrabold text-mr-fg',
                    interactive && 'cursor-pointer bg-transparent p-0 hover:text-mr-accent mr-focus-ring',
                    highlighted && 'text-mr-accent',
                )}
            >
                {name}
            </NameTag>
            {handle && <span className="text-mr-small text-mr-fg-subtle">@{handle}</span>}
            {time && (
                <>
                    <span aria-hidden="true" className="text-mr-fg-subtle">
                        ·
                    </span>
                    <span className="text-mr-small text-mr-fg-subtle">{time}</span>
                </>
            )}
            {badges}
            {right && (
                <>
                    <span className="ml-auto" />
                    {right}
                </>
            )}
        </div>
    );
};

export default PostHeader;
