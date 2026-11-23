import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderLegalPage } from './legal-pages.mjs';

test('publica todas as seções dos três idiomas e escapa conteúdo de origem', () => {
    const root = resolve(import.meta.dirname, '../../../../..');
    const locales = ['pt-BR', 'en-US', 'es-ES'];
    const translations = Object.fromEntries(locales.map(locale => [locale, JSON.parse(readFileSync(resolve(root, 'web/toonlira/src/i18n/locales', locale, 'legal.json'), 'utf8'))]));
    for (const kind of ['terms', 'privacy']) {
        const page = renderLegalPage(kind, translations);
        for (const locale of locales) {
            assert.match(page, new RegExp(`id="${locale}"`));
            for (const section of Object.values(translations[locale][kind].sections)) assert.ok(page.includes(section.title));
        }
    }
    translations['pt-BR'].terms.sections.aceite.p1 = '<script>alert(1)</script>';
    assert.ok(!renderLegalPage('terms', translations).includes('<script>'));
});

test('falha em vez de publicar texto legal incompleto', () => {
    assert.throws(() => renderLegalPage('privacy', {}));
});
