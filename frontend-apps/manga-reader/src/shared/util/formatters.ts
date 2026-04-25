import i18n from '@/i18n/config';

const getLocale = (): string => i18n.language || 'pt-BR';

export const formatDate = (
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions,
): string => {
    const value = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(getLocale(), options).format(value);
};

export const formatDateTime = (date: Date | string | number): string =>
    formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

export const formatShortDate = (date: Date | string | number): string =>
    formatDate(date, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

export const formatNumber = (
    value: number,
    options?: Intl.NumberFormatOptions,
): string => new Intl.NumberFormat(getLocale(), options).format(value);

export const formatCurrency = (
    value: number,
    currency: string = 'BRL',
): string =>
    formatNumber(value, {
        style: 'currency',
        currency,
    });

const RELATIVE_TIME_UNITS: {
    unit: Intl.RelativeTimeFormatUnit;
    seconds: number;
}[] = [
    { unit: 'year', seconds: 60 * 60 * 24 * 365 },
    { unit: 'month', seconds: 60 * 60 * 24 * 30 },
    { unit: 'week', seconds: 60 * 60 * 24 * 7 },
    { unit: 'day', seconds: 60 * 60 * 24 },
    { unit: 'hour', seconds: 60 * 60 },
    { unit: 'minute', seconds: 60 },
];

export const formatRelativeTime = (date: Date | string | number): string => {
    const value = date instanceof Date ? date : new Date(date);
    const diffInSeconds = (value.getTime() - Date.now()) / 1000;
    const formatter = new Intl.RelativeTimeFormat(getLocale(), {
        numeric: 'auto',
    });

    for (const { unit, seconds } of RELATIVE_TIME_UNITS) {
        if (Math.abs(diffInSeconds) >= seconds) {
            return formatter.format(
                Math.round(diffInSeconds / seconds),
                unit,
            );
        }
    }

    return formatter.format(Math.round(diffInSeconds), 'second');
};
