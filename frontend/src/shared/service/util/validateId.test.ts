import { describe, it, expect } from 'vitest';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';

import validateId from './validateId';

describe('validateId', () => {
    it('deve lancar erro quando id e NaN', () => {
        expect(() => validateId(NaN)).toThrow(ERROR_MESSAGES.INVALID_ID_ERROR);
    });

    it('nao deve lancar erro para id numerico valido', () => {
        expect(() => validateId(1)).not.toThrow();
    });

    it('nao deve lancar erro para id zero', () => {
        expect(() => validateId(0)).not.toThrow();
    });

    it('nao deve lancar erro para id negativo', () => {
        expect(() => validateId(-1)).not.toThrow();
    });
});
