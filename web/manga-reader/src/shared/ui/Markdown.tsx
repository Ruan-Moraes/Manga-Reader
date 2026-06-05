import { cn } from '@shared/lib/cn';
import { parseMarkdown } from '@shared/service/util/markdownService';

export interface MarkdownProps {
    text: string;
    /** Classes de tipografia do contexto (cor/tamanho/leading). */
    className?: string;
}

// Spoilers `||texto||` viram <span class="md-spoiler"> (markdown injetado via
// dangerouslySetInnerHTML) — o reveal é por listener delegado (clique/Enter).
const revealSpoiler = (target: EventTarget | null) => {
    if (target instanceof HTMLElement && target.classList.contains('md-spoiler')) {
        target.classList.add('is-shown');
    }
};

/** Render canônico de markdown — único ponto de `parseMarkdown` + reveal de spoiler. */
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
