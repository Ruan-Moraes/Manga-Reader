import { DEFAULT_TEXT_READER_PREFERENCES, normalizeTextReaderPreferences } from '../textReaderPreferences';

describe('MOB-FEAT-053 textual preferences', () => {
    it('uses safe defaults for absent or invalid values', () => {
        expect(normalizeTextReaderPreferences(null)).toEqual(DEFAULT_TEXT_READER_PREFERENCES);
        expect(normalizeTextReaderPreferences({ fontSize: 99, fontFamily: 'bad', lineSpacing: null })).toEqual(DEFAULT_TEXT_READER_PREFERENCES);
    });

    it('preserves valid independent settings', () => {
        expect(normalizeTextReaderPreferences({ fontSize: 28, fontFamily: 'SERIF', lineSpacing: 'WIDE', margins: 'NARROW', background: 'PAPER' })).toEqual({
            fontSize: 28,
            fontFamily: 'SERIF',
            lineSpacing: 'WIDE',
            margins: 'NARROW',
            background: 'PAPER',
        });
    });
});
