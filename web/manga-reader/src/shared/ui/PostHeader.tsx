import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export interface PostHeaderProps {
    name: string;
    handle?: string;
    time?: string;
    timeTitle?: string;
    onClickName?: () => void;
    nameProfileLabel?: string;
    meta?: ReactNode;
    badges?: ReactNode;
    right?: ReactNode;
    highlighted?: boolean;
}

export const PostHeader = ({
                               name,
                               handle,
                               time,
                               timeTitle,
                               onClickName,
                               nameProfileLabel,
                               meta,
                               badges,
                               right,
                               highlighted,
                           }: PostHeaderProps) => {
    const interactive = !!onClickName;

    const NameTag = interactive ? 'button' : 'span';

    const metaParts = [
        handle && <span key="handle">@{handle}</span>,
        time && (
            <time key="time" title={timeTitle}>
                {time}
            </time>
        ),
        meta && <span key="meta">{meta}</span>,
    ].filter(Boolean);

    return (
        <div className="flex flex-wrap gap-x-2 gap-y-1">
            <div className="flex flex-col flex-wrap items-start justify-center gap-x-2 gap-y-1">
                <NameTag
                    onClick={interactive ? onClickName : undefined}
                    aria-label={interactive ? nameProfileLabel : undefined}
                    className={cn(
                        'min-w-0 max-w-full truncate text-mr-body font-mr-extrabold leading-tight text-mr-fg',
                        interactive && 'cursor-pointer bg-transparent p-0 hover:text-mr-accent mr-focus-ring',
                        highlighted && 'text-mr-accent',
                    )}
                >
                    {name}
                </NameTag>

                {metaParts.length > 0 && (
                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-mr-small text-mr-fg-subtle">
                        {metaParts.map((part, i) => (
                            <span key={i} className="inline-flex items-baseline whitespace-nowrap">
                                {part}
                                {i < metaParts.length - 1 && (
                                    <span aria-hidden="true" className="ml-1.5 text-mr-fg-subtle/70 select-none">
                                        ·
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {badges && <div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
            {right && <div className="ml-auto mb-auto shrink-0 self-center">{right}</div>}
        </div>
    );
};

export default PostHeader;
