import i18n from '@/src/shared/i18n';

import {
    DEFAULT_DATE_FORMAT,
    DEFAULT_TIMEZONE,
    formatCurrency,
    formatDate,
    formatNumber,
    normalizeDateFormat,
    normalizeTimezone,
    SUPPORTED_TIMEZONES,
} from '..';

describe('MOB-FEAT-003 formatadores regionais', () => {
    const instant = '2026-01-02T02:30:00.000Z';

    it('mantém a ordem normativa dos três formatos e inclui o ano', () => {
        const dMon = formatDate(instant, { language: 'en-US', dateFormat: 'D_MON', timezone: 'UTC' });
        const dM = formatDate(instant, { language: 'en-US', dateFormat: 'D_M', timezone: 'UTC' });
        const monD = formatDate(instant, { language: 'en-US', dateFormat: 'MON_D', timezone: 'UTC' });

        expect(dMon).toMatch(/^2 Jan 2026$/);
        expect(dM).toBe('2/1/2026');
        expect(monD).toMatch(/^Jan 2 2026$/);
    });

    it('usa o timezone selecionado na virada de dia e normaliza valores desconhecidos', () => {
        expect(formatDate(instant, { dateFormat: 'D_M', timezone: 'UTC' })).toBe('02/01/2026');
        expect(formatDate(instant, { dateFormat: 'D_M', timezone: 'America/New_York' })).toBe('01/01/2026');
        expect(normalizeDateFormat('UNKNOWN')).toBe(DEFAULT_DATE_FORMAT);
        expect(normalizeTimezone('Mars/Olympus')).toBe(DEFAULT_TIMEZONE);
        expect(formatDate(instant, { dateFormat: 'UNKNOWN', timezone: 'Mars/Olympus' })).toContain('2026');
    });

    it.each(SUPPORTED_TIMEZONES)('formata sem falhar no timezone suportado %s', timezone => {
        expect(formatDate(instant, { dateFormat: 'D_M', timezone })).toMatch(/2026/);
    });

    it('recua para UTC se a plataforma rejeitar um timezone previamente validado', () => {
        const NativeDateTimeFormat = Intl.DateTimeFormat;
        const formatter = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((language, options) => {
            if (options?.timeZone === 'Asia/Tokyo') throw new RangeError('timezone unavailable');
            return new NativeDateTimeFormat(language, options);
        });
        expect(formatDate(instant, { dateFormat: 'D_M', timezone: 'Asia/Tokyo' })).toBe('02/01/2026');
        formatter.mockRestore();
    });

    it('retorna vazio para data ausente ou inválida sem derrubar a superfície', () => {
        expect(formatDate(null)).toBe('');
        expect(formatDate('not-a-date', { emptyValue: '—' })).toBe('—');
    });

    it('formata número e moeda pelo idioma efetivo da interface', () => {
        expect(formatNumber(1234.5, 'pt-BR')).toContain('1.234');
        expect(formatNumber(1234.5, 'en-US')).toContain('1,234');
        expect(formatCurrency(10, 'USD', 'en-US')).toContain('$');
    });

    it('usa o idioma efetivo do i18n quando a superfície não repete o locale', async () => {
        await i18n.changeLanguage('en-US');
        expect(formatNumber(1234.5)).toContain('1,234');
        expect(formatDate(instant, { dateFormat: 'MON_D', timezone: 'UTC' })).toMatch(/^Jan 2 2026$/);
        await i18n.changeLanguage('pt-BR');
    });
});
