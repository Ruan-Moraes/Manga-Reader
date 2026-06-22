import { cn } from '@shared/lib/cn';
import { parseMarkdown } from '@shared/service/util/markdownService';

export interface MarkdownProps {
    text: string;
    className?: string;
}

const revealSpoiler = (target: EventTarget | null) => {
    if (target instanceof HTMLElement && target.classList.contains('md-spoiler')) {
        target.classList.add('is-shown');
    }
};

export const Markdown = ({ text, className }: MarkdownProps) => (
    <div
        className={cn('mr-markdown', className)}
        onClick={event => revealSpoiler(event.target)}
        onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') revealSpoiler(event.target);
        }}
        dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }}
    />
);

export default Markdown;
