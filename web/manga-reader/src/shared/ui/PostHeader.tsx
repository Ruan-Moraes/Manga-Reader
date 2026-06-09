import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export interface PostHeaderProps {
    name: string;
    handle?: string;
    time?: string;
    /** Tooltip exibido no hover do tempo — dia + hora absolutos. */
    timeTitle?: string;
    onClickName?: () => void;
    nameProfileLabel?: string;
    badges?: ReactNode;
    right?: ReactNode;
    highlighted?: boolean;
}

/**
 * Cabeçalho canônico de post: nome · @handle · • · tempo · <badges> … <right>.
 * Funde o que antes vivia separado em CommentUser + CommentMetadata.
 */
export const PostHeader = ({ name, handle, time, timeTitle, onClickName, nameProfileLabel, badges, right, highlighted }: PostHeaderProps) => {
    const interactive = !!onClickName;

    const NameTag = interactive ? 'button' : 'span';

    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="flex flex-col items-start gap-y-0.5">
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
                {time && (
                    <div className="flex items-center gap-x-2">
                        <span aria-hidden="true" className="text-mr-fg-subtle">
                            ·
                        </span>
                        <span className="text-mr-small text-mr-fg-subtle" title={timeTitle}>
                            {time}
                        </span>
                    </div>
                )}
            </div>

            {handle && <span className="text-mr-small text-mr-fg-subtle">@{handle}</span>}

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
