import { getCurrentLanguage, normalizeInterfaceLanguage, type SupportedLanguage } from '@/src/shared/i18n';

export const DATE_FORMATS = ['D_MON', 'D_M', 'MON_D'] as const;
export type DateFormatPreference = (typeof DATE_FORMATS)[number];

export const SUPPORTED_TIMEZONES = ['America/Sao_Paulo', 'America/New_York', 'Europe/Lisbon', 'Asia/Tokyo', 'UTC'] as const;
export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number];

export const DEFAULT_DATE_FORMAT: DateFormatPreference = 'D_MON';
export const DEFAULT_TIMEZONE: SupportedTimezone = 'America/Sao_Paulo';

const isDateFormat = (value: unknown): value is DateFormatPreference => DATE_FORMATS.includes(value as DateFormatPreference);
const isSupportedTimezone = (value: unknown): value is SupportedTimezone => SUPPORTED_TIMEZONES.includes(value as SupportedTimezone);

export const normalizeDateFormat = (value: unknown): DateFormatPreference => (isDateFormat(value) ? value : DEFAULT_DATE_FORMAT);
export const normalizeTimezone = (value: unknown): SupportedTimezone => (isSupportedTimezone(value) ? value : DEFAULT_TIMEZONE);

type DateInput = Date | string | number | null | undefined;

export interface DateFormattingOptions {
    language?: SupportedLanguage | string | null;
    dateFormat?: DateFormatPreference | string | null;
    timezone?: SupportedTimezone | string | null;
    includeYear?: boolean;
    emptyValue?: string;
}

const validDate = (value: DateInput): Date | null => {
    if (value === null || value === undefined || value === '') return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const dateParts = (date: Date, language: SupportedLanguage, timezone: string, dateFormat: DateFormatPreference) => {
    const formatter = new Intl.DateTimeFormat(language, {
        day: 'numeric',
        month: dateFormat === 'D_M' ? 'numeric' : 'short',
        year: 'numeric',
        timeZone: timezone,
    });
    const parts = formatter.formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find(item => item.type === type)?.value ?? '';
    return { day: part('day'), month: part('month'), year: part('year') };
};

export function formatDate(value: DateInput, options: DateFormattingOptions = {}): string {
    const date = validDate(value);
    if (!date) return options.emptyValue ?? '';

    const language = normalizeInterfaceLanguage(options.language ?? getCurrentLanguage());
    const dateFormat = normalizeDateFormat(options.dateFormat);
    const timezone = normalizeTimezone(options.timezone);
    const includeYear = options.includeYear ?? true;

    let parts: ReturnType<typeof dateParts>;
    try {
        parts = dateParts(date, language, timezone, dateFormat);
    } catch {
        try {
            parts = dateParts(date, language, 'UTC', dateFormat);
        } catch {
            return options.emptyValue ?? '';
        }
    }

    const year = includeYear ? ` ${parts.year}` : '';
    if (dateFormat === 'D_M') return `${parts.day}/${parts.month}${includeYear ? `/${parts.year}` : ''}`;
    if (dateFormat === 'MON_D') return `${parts.month} ${parts.day}${year}`;
    return `${parts.day} ${parts.month}${year}`;
}

export function formatNumber(value: number, language?: SupportedLanguage | string | null): string {
    return new Intl.NumberFormat(normalizeInterfaceLanguage(language ?? getCurrentLanguage())).format(value);
}

export function formatCurrency(value: number, currency: string, language?: SupportedLanguage | string | null): string {
    return new Intl.NumberFormat(normalizeInterfaceLanguage(language ?? getCurrentLanguage()), { style: 'currency', currency }).format(value);
}
