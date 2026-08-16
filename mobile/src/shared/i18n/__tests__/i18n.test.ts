import fs from 'node:fs';
import path from 'node:path';

import i18n, { DEFAULT_LANGUAGE, getCurrentLanguage, NAMESPACES, normalizeInterfaceLanguage, SUPPORTED_LANGUAGES } from '..';
import enUSAuth from '../locales/en-US/auth.json';
import enUSCommon from '../locales/en-US/common.json';
import enUSLauncher from '../locales/en-US/launcher.json';
import enUSReader from '../locales/en-US/reader.json';
import enUSSettingsNavigation from '../locales/en-US/settingsNavigation.json';
import esESAuth from '../locales/es-ES/auth.json';
import esESCommon from '../locales/es-ES/common.json';
import esESLauncher from '../locales/es-ES/launcher.json';
import esESReader from '../locales/es-ES/reader.json';
import esESSettingsNavigation from '../locales/es-ES/settingsNavigation.json';
import ptBRAuth from '../locales/pt-BR/auth.json';
import ptBRCommon from '../locales/pt-BR/common.json';
import ptBRLauncher from '../locales/pt-BR/launcher.json';
import ptBRReader from '../locales/pt-BR/reader.json';
import ptBRSettingsNavigation from '../locales/pt-BR/settingsNavigation.json';

function flattenKeys(value: unknown, prefix = ''): string[] {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return [prefix];
    return Object.entries(value).flatMap(([key, nested]) => flattenKeys(nested, prefix ? `${prefix}.${key}` : key));
}

function sourceFiles(directory: string): string[] {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return sourceFiles(entryPath);
        return /\.tsx?$/.test(entry.name) && !entryPath.includes('__tests__') ? [entryPath] : [];
    });
}

describe('MOB-BASE-003 i18n', () => {
    afterEach(async () => {
        await i18n.changeLanguage(DEFAULT_LANGUAGE);
    });

    it('registra os três idiomas e os namespaces observados', () => {
        expect(SUPPORTED_LANGUAGES).toEqual(['pt-BR', 'en-US', 'es-ES']);
        expect(NAMESPACES).toEqual(['common', 'auth', 'launcher', 'reader', 'settingsNavigation']);
        expect(DEFAULT_LANGUAGE).toBe('pt-BR');
    });

    it.each([
        ['common', ptBRCommon, enUSCommon, esESCommon],
        ['auth', ptBRAuth, enUSAuth, esESAuth],
        ['launcher', ptBRLauncher, enUSLauncher, esESLauncher],
        ['reader', ptBRReader, enUSReader, esESReader],
        ['settingsNavigation', ptBRSettingsNavigation, enUSSettingsNavigation, esESSettingsNavigation],
    ])('mantém paridade de chaves no namespace %s', (_namespace, ptBR, enUS, esES) => {
        const reference = flattenKeys(ptBR).sort();
        expect(flattenKeys(enUS).sort()).toEqual(reference);
        expect(flattenKeys(esES).sort()).toEqual(reference);
    });

    it('normaliza idioma ativo não suportado para o fallback', async () => {
        await i18n.changeLanguage('fr-FR');
        expect(getCurrentLanguage()).toBe(DEFAULT_LANGUAGE);
        expect(normalizeInterfaceLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
        expect(normalizeInterfaceLanguage('invalid')).toBe(DEFAULT_LANGUAGE);
        expect(SUPPORTED_LANGUAGES.map(normalizeInterfaceLanguage)).toEqual(SUPPORTED_LANGUAGES);
    });

    it('mantém ao menos um consumidor real para cada namespace registrado', () => {
        const mobileRoot = path.resolve(__dirname, '../../../..');
        const sources = [...sourceFiles(path.join(mobileRoot, 'src')), ...sourceFiles(path.join(mobileRoot, 'app'))].map(file => fs.readFileSync(file, 'utf8'));

        for (const namespace of NAMESPACES) {
            expect(sources.some(source => source.includes(`useTranslation('${namespace}')`) || source.includes(`useTranslation("${namespace}")`))).toBe(true);
        }
    });
});
