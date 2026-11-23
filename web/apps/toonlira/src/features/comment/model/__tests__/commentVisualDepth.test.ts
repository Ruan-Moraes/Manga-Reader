import { describe, expect, it } from 'vitest';

import { getCommentVisualDepth } from '../commentVisualDepth';

describe('getCommentVisualDepth', () => {
    it('keeps the parent at visual depth zero on mobile', () => {
        expect(getCommentVisualDepth(0, false)).toBe(0);
    });

    it('caps every mobile reply at visual depth one', () => {
        expect(getCommentVisualDepth(1, false)).toBe(1);
        expect(getCommentVisualDepth(2, false)).toBe(1);
        expect(getCommentVisualDepth(3, false)).toBe(1);
    });

    it('preserves actual depth on desktop', () => {
        expect(getCommentVisualDepth(0, true)).toBe(0);
        expect(getCommentVisualDepth(1, true)).toBe(1);
        expect(getCommentVisualDepth(3, true)).toBe(3);
    });
});
