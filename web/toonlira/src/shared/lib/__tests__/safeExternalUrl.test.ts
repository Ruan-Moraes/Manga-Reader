import { describe, expect, it } from 'vitest';

import { toSafeExternalUrl } from '../safeExternalUrl';

describe('toSafeExternalUrl', () => {
    it('accepts only absolute HTTP(S) URLs', () => {
        expect(toSafeExternalUrl('https://publisher.example/path')).toBe('https://publisher.example/path');
        expect(toSafeExternalUrl('http://publisher.example')).toBe('http://publisher.example/');
        expect(toSafeExternalUrl('/relative')).toBeNull();
        expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull();
        expect(toSafeExternalUrl('data:text/html,unsafe')).toBeNull();
    });
});
