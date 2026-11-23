export interface TextReaderPreferences {
    fontFamily: 'APP' | 'SERIF';
    fontSize: number;
    lineSpacing: 'COMPACT' | 'COMFORTABLE' | 'WIDE';
    margins: 'NARROW' | 'MEDIUM' | 'WIDE';
    background: 'APP' | 'LIGHT' | 'PAPER' | 'DARK';
}

export const DEFAULT_TEXT_READER_PREFERENCES: TextReaderPreferences = {
    fontFamily: 'APP',
    fontSize: 18,
    lineSpacing: 'COMFORTABLE',
    margins: 'MEDIUM',
    background: 'APP',
};

function choice<T extends string>(value: unknown, choices: readonly T[], fallback: T): T {
    return typeof value === 'string' && choices.includes(value as T) ? (value as T) : fallback;
}

export function normalizeTextReaderPreferences(value: unknown): TextReaderPreferences {
    const source = value && typeof value === 'object' ? (value as Partial<TextReaderPreferences>) : {};

    return {
        fontFamily: choice(source.fontFamily, ['APP', 'SERIF'], 'APP'),
        fontSize:
            typeof source.fontSize === 'number' && Number.isInteger(source.fontSize) && source.fontSize >= 16 && source.fontSize <= 28 ? source.fontSize : 18,
        lineSpacing: choice(source.lineSpacing, ['COMPACT', 'COMFORTABLE', 'WIDE'], 'COMFORTABLE'),
        margins: choice(source.margins, ['NARROW', 'MEDIUM', 'WIDE'], 'MEDIUM'),
        background: choice(source.background, ['APP', 'LIGHT', 'PAPER', 'DARK'], 'APP'),
    };
}
