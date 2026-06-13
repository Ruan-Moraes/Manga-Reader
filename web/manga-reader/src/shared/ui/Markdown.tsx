// TODO: Enquanto o usuario nao clicar em mostrar o spoiler, nos vamos mostrar um texto: "Mostrar spoiler". Quando o usuario clicar, a gente mostra o texto do spoiler. O texto do spoiler vai ser o que tiver entre os pipes duplos: ||texto do spoiler||. A gente vai usar uma regex pra encontrar esses textos e substituir por um span com a classe "md-spoiler". A gente vai adicionar um event listener nesse span pra quando o usuario clicar, a gente adicionar a classe "is-shown" nele, ai a gente pode usar CSS pra mostrar o texto do spoiler quando a classe "is-shown" estiver presente.

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
