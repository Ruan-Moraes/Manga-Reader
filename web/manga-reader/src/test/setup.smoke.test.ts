import { describe, it, expect } from 'vitest';

describe('Setup smoke test', () => {
    it('vitest esta funcionando', () => {
        expect(1 + 1).toBe(2);
    });

    it('jsdom esta disponivel', () => {
        const div = document.createElement('div');
        div.textContent = 'Manga Reader';
        expect(div.textContent).toBe('Manga Reader');
    });
});
