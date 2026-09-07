import i18n from '@/i18n/config';

export const getLocale = (): string => i18n.language || 'pt-BR';

const getPreferredTimezone = (): string | undefined => (typeof document === 'undefined' ? undefined : document.documentElement.dataset.mrTimezone);

const getPreferredDateOptions = (): Intl.DateTimeFormatOptions => {
    const preference = typeof document === 'undefined' ? undefined : document.documentElement.dataset.mrDateFormat;

    if (preference === 'D_M') return { year: 'numeric', month: '2-digit', day: '2-digit' };
    if (preference === 'MON_D') return { year: 'numeric', month: 'short', day: '2-digit' };
    return { year: 'numeric', day: '2-digit', month: 'short' };
};

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

    const resolvedOptions = { ...(options ?? getPreferredDateOptions()), timeZone: options?.timeZone ?? getPreferredTimezone() };

    try {
        return new Intl.DateTimeFormat(getLocale(), resolvedOptions).format(value);
    } catch {
        // Preferência de timezone inválida nunca deve derrubar uma tela.
        const { timeZone: _invalidTimezone, ...safeOptions } = resolvedOptions;
        return new Intl.DateTimeFormat(getLocale(), safeOptions).format(value);
    }
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
    formatDate(date, getPreferredDateOptions());

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => new Intl.NumberFormat(getLocale(), options).format(value);

export const formatCurrency = (value: number, currency: string = 'BRL'): string =>
    formatNumber(value, {
        style: 'currency',
        currency,
    });
