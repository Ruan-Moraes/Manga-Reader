import { canTransitionTranslationState, isTerminalTranslationState, TRANSLATION_STATES } from '../translationPage';

describe('MOB-FEAT-016 translation state policy', () => {
    const allowed = new Set([
        'DRAFT:QUEUED',
        'DRAFT:CANCELLED',
        'QUEUED:PROCESSING',
        'QUEUED:FAILED',
        'QUEUED:CANCELLED',
        'PROCESSING:READY',
        'PROCESSING:FAILED',
        'PROCESSING:CANCELLED',
        'FAILED:QUEUED',
        'FAILED:CANCELLED',
    ]);

    it('accepts exactly the normative state transitions', () => {
        for (const from of TRANSLATION_STATES) {
            for (const to of TRANSLATION_STATES) {
                expect(canTransitionTranslationState(from, to)).toBe(allowed.has(`${from}:${to}`));
            }
        }
    });

    it('protects ready and cancelled as terminal facts', () => {
        expect(isTerminalTranslationState('READY')).toBe(true);
        expect(isTerminalTranslationState('CANCELLED')).toBe(true);
        expect(isTerminalTranslationState('FAILED')).toBe(false);
    });
});
