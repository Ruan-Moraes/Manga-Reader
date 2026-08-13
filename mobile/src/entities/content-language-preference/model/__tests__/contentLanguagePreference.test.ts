import { addContentLanguage, deriveGuestContentLanguages, moveContentLanguage, normalizeContentLanguages, removeContentLanguage } from '../../index';

describe('MOB-FEAT-004 content language preference', () => {
    it('normaliza a resposta preservando primeiras ocorrências, ordem e fallback único', () => {
        expect(normalizeContentLanguages(['en-US', 'fr-FR', 'en-US', 'es-ES'])).toEqual(['en-US', 'es-ES', 'pt-BR']);
        expect(normalizeContentLanguages([])).toEqual(['pt-BR']);
        expect(normalizeContentLanguages(['fr-FR', '', null])).toEqual(['pt-BR']);
        expect(normalizeContentLanguages(['pt-BR', 'pt-BR'])).toEqual(['pt-BR']);
    });

    it.each([
        ['pt-BR', ['pt-BR']],
        ['en-US', ['en-US', 'pt-BR']],
        ['es-ES', ['es-ES', 'pt-BR']],
    ] as const)('deriva a política guest para %s sem persistência fictícia', (language, expected) => {
        expect(deriveGuestContentLanguages(language)).toEqual(expected);
    });

    it('adiciona, move e remove mantendo prioridade e impedindo remover pt-BR', () => {
        const added = addContentLanguage(['pt-BR'], 'en-US');
        expect(added).toEqual(['pt-BR', 'en-US']);
        expect(moveContentLanguage(added, 1, 0)).toEqual(['en-US', 'pt-BR']);
        expect(removeContentLanguage(['en-US', 'pt-BR'], 'en-US')).toEqual(['pt-BR']);
        expect(removeContentLanguage(['en-US', 'pt-BR'], 'pt-BR')).toEqual(['en-US', 'pt-BR']);
    });
});
