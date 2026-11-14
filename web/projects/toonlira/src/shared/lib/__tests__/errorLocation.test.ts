import { describe, expect, it } from 'vitest';

import { getErrorLocation, getFileName } from '../errorLocation';

describe('errorLocation', () => {
    it('extrai arquivo, linha e coluna de uma stack do Vite', () => {
        const stack = 'Error: Falha\n    at Reader (http://localhost:5173/src/pages/chapter/ui/Chapter.tsx?t=1:42:17)';

        expect(getErrorLocation(stack)).toEqual({
            file: 'http://localhost:5173/src/pages/chapter/ui/Chapter.tsx',
            line: 42,
            column: 17,
        });
    });

    it('suporta frames no formato do Safari', () => {
        expect(getErrorLocation('Error: Falha\nReader@http://localhost:5173/src/Reader.tsx:8:3')).toEqual({
            file: 'http://localhost:5173/src/Reader.tsx',
            line: 8,
            column: 3,
        });
    });

    it('retorna null quando nao ha localizacao', () => {
        expect(getErrorLocation('Error: Falha')).toBeNull();
    });

    it('resume o caminho para o nome do arquivo', () => {
        expect(getFileName('/src/pages/Reader.tsx')).toBe('Reader.tsx');
    });
});
