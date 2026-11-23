import { DEFAULT_TEXT_READER_PREFERENCES } from '@/entities/user-setting';
import { lightTokens } from '@/shared/theme';

import { captureTextAnchor, textReaderPalette, textReaderTypography, textReadingPercent, textRestoreOffset } from '../textReader';

const boxes = [
    { id: 'short', y: 0, height: 100 },
    { id: 'long', y: 100, height: 1000 },
];
const blocks = [
    { id: 'short', type: 'paragraph' as const, text: 'x'.repeat(100) },
    { id: 'long', type: 'paragraph' as const, text: 'y'.repeat(900) },
];
describe('MOB-FEAT-053 text layout and progress', () => {
    it('restores fraction within a paragraph taller than the screen after reflow', () => {
        const anchor = captureTextAnchor(boxes, 600);
        expect(anchor).toEqual({ itemId: 'long', index: 1, itemOffsetRatio: 0.5 });
        expect(textRestoreOffset({ id: 'long', y: 200, height: 2000 }, anchor, 20)).toBe(1180);
    });
    it('weights text length, gives zero at the beginning and 100 when all content fits', () => {
        expect(textReadingPercent(blocks, boxes, 0, 300, 1100)).toBe(0);
        expect(textReadingPercent(blocks, boxes, 600, 300, 1100)).toBe(55);
        expect(textReadingPercent(blocks, boxes, 800, 300, 1100)).toBe(100);
        expect(textReadingPercent(blocks, boxes, 0, 1200, 1100)).toBe(100);
    });
    it('uses standalone readable typography and native serif', () => {
        expect(textReaderTypography(DEFAULT_TEXT_READER_PREFERENCES, 'ios')).toMatchObject({ fontSize: 18, lineHeight: 29.7 });
        expect(textReaderTypography({ ...DEFAULT_TEXT_READER_PREFERENCES, fontFamily: 'SERIF' }, 'ios').fontFamily).toBe('Georgia');
        expect(textReaderTypography({ ...DEFAULT_TEXT_READER_PREFERENCES, fontFamily: 'SERIF' }, 'android').fontFamily).toBe('serif');
    });
    it('keeps app palette by default and respects high contrast over paper', () => {
        expect(textReaderPalette('APP', lightTokens, 'light', false).tokens).toBe(lightTokens);
        expect(textReaderPalette('PAPER', lightTokens, 'light', true).tokens.text).toBe('#000000');
        expect(textReaderPalette('DARK', lightTokens, 'light', false).colorScheme).toBe('dark');
    });
});
