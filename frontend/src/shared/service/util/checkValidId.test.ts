import { describe, it, expect } from 'vitest';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';

import checkValidId from './checkValidId';

describe('checkValidId', () => {
    it('deve lancar erro quando id e NaN', () => {
        expect(() => checkValidId(NaN)).toThrow(
            ERROR_MESSAGES.INVALID_ID_ERROR,
        );
    });

    it('nao deve lancar erro para id numerico valido', () => {
        expect(() => checkValidId(42)).not.toThrow();
    });

    it('nao deve lancar erro para id zero', () => {
        expect(() => checkValidId(0)).not.toThrow();
    });
});
