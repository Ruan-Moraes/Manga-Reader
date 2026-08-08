import i18n, { DEFAULT_LANGUAGE, getCurrentLanguage, NAMESPACES, SUPPORTED_LANGUAGES } from '..';
import enUSAuth from '../locales/en-US/auth.json';
import enUSCommon from '../locales/en-US/common.json';
import esESAuth from '../locales/es-ES/auth.json';
import esESCommon from '../locales/es-ES/common.json';
import ptBRAuth from '../locales/pt-BR/auth.json';
import ptBRCommon from '../locales/pt-BR/common.json';

function flattenKeys(value: unknown, prefix = ''): string[] {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return [prefix];
    return Object.entries(value).flatMap(([key, nested]) => flattenKeys(nested, prefix ? `${prefix}.${key}` : key));
}

describe('MOB-BASE-003 i18n', () => {
    afterEach(async () => {
        await i18n.changeLanguage(DEFAULT_LANGUAGE);
    });

    it('registra os três idiomas e os namespaces observados', () => {
        expect(SUPPORTED_LANGUAGES).toEqual(['pt-BR', 'en-US', 'es-ES']);
        expect(NAMESPACES).toEqual(['common', 'auth']);
        expect(DEFAULT_LANGUAGE).toBe('pt-BR');
    });

    it.each([
        ['common', ptBRCommon, enUSCommon, esESCommon],
        ['auth', ptBRAuth, enUSAuth, esESAuth],
    ])('mantém paridade de chaves no namespace %s', (_namespace, ptBR, enUS, esES) => {
        const reference = flattenKeys(ptBR).sort();
        expect(flattenKeys(enUS).sort()).toEqual(reference);
        expect(flattenKeys(esES).sort()).toEqual(reference);
    });

    it('normaliza idioma ativo não suportado para o fallback', async () => {
        await i18n.changeLanguage('fr-FR');
        expect(getCurrentLanguage()).toBe(DEFAULT_LANGUAGE);
    });
});
