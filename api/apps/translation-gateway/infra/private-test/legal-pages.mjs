import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const locales = ['pt-BR', 'en-US', 'es-ES'];
const languages = { 'pt-BR': 'Português', 'en-US': 'English', 'es-ES': 'Español' };
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function renderValue(value) {
    if (typeof value === 'string') return `<p>${escape(value).replaceAll('&lt;strong&gt;', '<strong>').replaceAll('&lt;/strong&gt;', '</strong>')}</p>`;
    if (Array.isArray(value)) return `<ul>${value.map(item => `<li>${renderValue(item)}</li>`).join('')}</ul>`;
    if (value && typeof value === 'object') return Object.values(value).map(renderValue).join('');
    throw new Error('Unsupported legal value');
}

export function renderLegalPage(kind, translations) {
    if (!['terms', 'privacy'].includes(kind)) throw new Error('Unsupported legal page');
    const nav = locales.map(locale => `<a href="#${locale}">${languages[locale]}</a>`).join(' · ');
    const sections = locales.map(locale => {
        const page = translations[locale]?.[kind];
        if (!page?.title || !page.sections || typeof page.sections !== 'object') throw new Error(`Missing ${locale} ${kind}`);
        const content = Object.entries(page.sections).map(([id, section]) => {
            if (!section?.title || !/^[a-z0-9-]+$/.test(id)) throw new Error(`Invalid ${locale} ${kind} section`);
            return `<section><h3>${escape(section.title)}</h3>${Object.entries(section).filter(([key]) => key !== 'title').map(([, value]) => renderValue(value)).join('')}</section>`;
        }).join('');
        return `<article id="${locale}" lang="${locale}"><h2>${escape(page.title)}</h2>${renderValue(page.sub)}${renderValue(page.updated)}${content}</article>`;
    }).join('');
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Toonlira — ${escape(kind)}</title><style>body{max-width:52rem;margin:2rem auto;padding:0 1rem;font:1rem/1.6 system-ui,sans-serif;color:#202124}nav{position:sticky;top:0;background:white;padding:.8rem 0}article{padding-top:1rem}section{border-top:1px solid #ddd}a{color:#174ea6}li p{margin:.3rem 0}</style></head><body><h1>Toonlira</h1><nav aria-label="Idioma / Language / Idioma">${nav}</nav>${sections}</body></html>\n`;
}

export function generateLegalPages(repoRoot, outputRoot) {
    const translations = Object.fromEntries(locales.map(locale => [locale, JSON.parse(readFileSync(resolve(repoRoot, 'web/toonlira/src/i18n/locales', locale, 'legal.json'), 'utf8'))]));
    for (const kind of ['terms', 'privacy']) {
        const dir = resolve(outputRoot, 'legal', kind);
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, 'index.html'), renderLegalPage(kind, translations));
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    if (!process.argv[2]) throw new Error('Output directory required');
    const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
    generateLegalPages(repoRoot, resolve(process.argv[2]));
}
