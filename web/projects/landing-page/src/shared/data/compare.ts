export type CompareValue = 'yes' | 'no' | 'limited';

export interface CompareRow {
    free: CompareValue;
    premium: CompareValue;
}

export const COMPARE_ROWS: CompareRow[] = [
    { free: 'yes', premium: 'yes' },
    { free: 'yes', premium: 'no' },
    { free: 'no', premium: 'yes' },
    { free: 'limited', premium: 'yes' },
    { free: 'limited', premium: 'yes' },
    { free: 'yes', premium: 'yes' },
    { free: 'no', premium: 'yes' },
];
