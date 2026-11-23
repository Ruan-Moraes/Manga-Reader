import { describe, it, expect } from 'vitest';

import { CHAPTER_STATUSES } from '../chapterAdmin.types';
import { CHAPTER_STATUS_TRANSITIONS, canTransition, isChapterPubliclyVisible } from '../chapterStatus';

describe('chapterStatus', () => {
    it('toda transição declarada aponta para status conhecidos', () => {
        for (const [from, targets] of Object.entries(CHAPTER_STATUS_TRANSITIONS)) {
            expect(CHAPTER_STATUSES).toContain(from);
            for (const to of targets) expect(CHAPTER_STATUSES).toContain(to);
        }
    });

    it('permite fluxo principal draft → published → hidden → published', () => {
        expect(canTransition('draft', 'published')).toBe(true);
        expect(canTransition('published', 'hidden')).toBe(true);
        expect(canTransition('hidden', 'published')).toBe(true);
    });

    it('permite agendar e despublicar por arquivamento', () => {
        expect(canTransition('draft', 'scheduled')).toBe(true);
        expect(canTransition('scheduled', 'published')).toBe(true);
        expect(canTransition('published', 'archived')).toBe(true);
        expect(canTransition('archived', 'draft')).toBe(true);
    });

    it('bloqueia transições sem sentido', () => {
        expect(canTransition('published', 'draft')).toBe(false);
        expect(canTransition('archived', 'published')).toBe(false);
        expect(canTransition('hidden', 'draft')).toBe(false);
    });

    it('somente published é público — hidden/unavailable/archived ficam restritos ao painel', () => {
        expect(isChapterPubliclyVisible('published')).toBe(true);
        for (const status of CHAPTER_STATUSES.filter(s => s !== 'published')) {
            expect(isChapterPubliclyVisible(status), status).toBe(false);
        }
    });
});
