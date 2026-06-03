import i18n from '@/i18n/config';

export const getLocale = (): string => i18n.language || 'pt-BR';

export const formatDate = (date: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
    if (date == null) {
        return '';
    }

    const value = date instanceof Date ? date : new Date(date);

    // Intl.DateTimeFormat.format lança RangeError ("Invalid time value") para
    // datas inválidas — não derrubar a tela inteira por um dado malformado.
    if (Number.isNaN(value.getTime())) {
        return '';
    }

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

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => new Intl.NumberFormat(getLocale(), options).format(value);

export const formatCurrency = (value: number, currency: string = 'BRL'): string =>
    formatNumber(value, {
        style: 'currency',
        currency,
    });
