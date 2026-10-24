import { APP_MODULES } from '../modules';

describe('MOB-FEAT-010 app modules', () => {
    it('expõe somente os módulos reais e sua disponibilidade', () => {
        expect(APP_MODULES).toEqual([
            { id: 'offline-translation', availability: 'local-first', icon: 'language-outline' },
            { id: 'platform', availability: 'construction', icon: 'book-outline' },
        ]);
    });
});
