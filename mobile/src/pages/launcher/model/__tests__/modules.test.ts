import { APP_MODULES } from '../modules';

describe('MOB-FEAT-010 app modules', () => {
    it('expõe somente os módulos reais e sua disponibilidade', () => {
        expect(APP_MODULES).toEqual([
            { id: 'platform', availability: 'construction', icon: 'book-outline' },
            { id: 'offline-translation', availability: 'offline', icon: 'language-outline' },
        ]);
    });
});
