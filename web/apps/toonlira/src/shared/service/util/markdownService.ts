import { marked } from 'marked';
import DOMPurify from 'dompurify';

const renderer = new marked.Renderer();

const originalLink = renderer.link;

renderer.link = function (args) {
    const html = originalLink.call(this, args);

    return html
        .replace('<a ', '<a target="_blank" rel="noopener noreferrer" ')
        .replace('target="_blank" rel="noopener noreferrer" target="_blank"', 'target="_blank" rel="noopener noreferrer"');
};

marked.setOptions({
    breaks: true,
    gfm: true,
    renderer,
});

const PURIFY_CONFIG = {
    ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'b',
        'em',
        'i',
        'u',
        's',
        'del',
        'h1',
        'h2',
        'h3',
        'h4',
        'ul',
        'ol',
        'li',
        'blockquote',
        'code',
        'pre',
        'a',
        'hr',
        'span',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'tabindex'],
    ALLOW_DATA_ATTR: false,
};

const SPOILER_RE = /\|\|([^|\n]+?)\|\|/g;

const markSpoilers = (text: string): string => text.replace(SPOILER_RE, '<span class="md-spoiler" tabindex="0">$1</span>');

export const parseMarkdown = (text: string): string => {
    const rawHtml = marked.parse(markSpoilers(text), { async: false }) as string;

    return DOMPurify.sanitize(rawHtml, PURIFY_CONFIG) as string;
};
