import { createReaderInteraction, readerInteractionReducer, resolveReaderTap, validRevealSwipe } from '../readerInteraction';

describe('MOB-FEAT-052 interaction', () => {
    it.each(['TAP', 'SWIPE', 'TAP_OR_SWIPE'] as const)('starts hidden; scroll never reveals in %s', mode => {
        let state = createReaderInteraction(mode);
        expect(state.visible).toBe(false);
        state = readerInteractionReducer(state, { type: 'reveal' });
        expect(state.visible).toBe(true);
        state = readerInteractionReducer(state, { type: 'dragStart' });
        state = readerInteractionReducer(state, { type: 'momentumStart' });
        state = readerInteractionReducer(state, { type: 'dragEnd' });
        expect(readerInteractionReducer(state, { type: 'reveal' }).visible).toBe(false);
        expect(readerInteractionReducer(state, { type: 'momentumEnd' }).visible).toBe(false);
    });
    it('visible mode waits for drag and momentum to finish', () => {
        let state = createReaderInteraction('VISIBLE');
        expect(state.visible).toBe(true);
        state = readerInteractionReducer(state, { type: 'dragStart' });
        state = readerInteractionReducer(state, { type: 'momentumStart' });
        state = readerInteractionReducer(state, { type: 'dragEnd' });
        expect(state.visible).toBe(false);
        expect(readerInteractionReducer(state, { type: 'momentumEnd' }).visible).toBe(true);
    });
    it('preserves visibility between manual modes and defers visible mode during motion', () => {
        let state = readerInteractionReducer(createReaderInteraction('TAP'), { type: 'reveal' });
        expect(readerInteractionReducer(state, { type: 'preference', mode: 'SWIPE' }).visible).toBe(true);
        state = readerInteractionReducer(state, { type: 'dragStart' });
        expect(readerInteractionReducer(state, { type: 'preference', mode: 'VISIBLE' }).visible).toBe(false);
    });
    it('accepts only short upward swipes', () => {
        expect(validRevealSwipe(0, -24, 400)).toBe(true);
        for (const [x, y, duration] of [
            [17, -50, 200],
            [0, -23, 200],
            [0, -50, 401],
            [0, 50, 200],
        ]) {
            expect(validRevealSwipe(x, y, duration)).toBe(false);
        }
    });
    it('hides before navigation and respects RTL and availability', () => {
        const input = { x: 10, width: 400, visible: false, mode: 'TAP_OR_SWIPE' as const, sideNavigation: true, paged: true, rtl: false };
        expect(resolveReaderTap(input)).toBe('previous');
        expect(resolveReaderTap({ ...input, rtl: true })).toBe('next');
        expect(resolveReaderTap({ ...input, visible: true })).toBe('hide');
        expect(resolveReaderTap({ ...input, paged: false })).toBe('toggle');
        expect(resolveReaderTap({ ...input, sideNavigation: false, mode: 'SWIPE' })).toBe('none');
        expect(resolveReaderTap({ ...input, x: 200 })).toBe('toggle');
    });
});
