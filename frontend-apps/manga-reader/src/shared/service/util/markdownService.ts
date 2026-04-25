import { marked } from 'marked';
import DOMPurify from 'dompurify';

const renderer = new marked.Renderer();

const originalLink = renderer.link;
renderer.link = function (args) {
    const html = originalLink.call(this, args);
    return html
        .replace('<a ', '<a target="_blank" rel="noopener noreferrer" ')
        .replace(
            'target="_blank" rel="noopener noreferrer" target="_blank"',
            'target="_blank" rel="noopener noreferrer"',
        );
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
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
};

export const parseMarkdown = (text: string): string => {
    const rawHtml = marked.parse(text, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml, PURIFY_CONFIG) as string;
};
