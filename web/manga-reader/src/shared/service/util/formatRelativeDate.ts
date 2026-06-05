// Single source of truth for relative-date labels (pt-BR).
// NOTE (i18n debt, deferred): strings are hardcoded pt-BR. Migrating to
// Intl.RelativeTimeFormat (locale-aware) is a separate i18n task — see DT-25.3.

// O api serializa `createdAt` com ISO_LOCAL_DATE_TIME, que pode trazer fração
// de segundo com até 9 dígitos (nanos). `new Date(...)` no JS só aceita 3 (ms) e
// retorna Invalid Date — por isso normalizamos antes de parsear.
const parseDate = (input: string): number => {
    if (!input) return NaN;

    const normalized = input
        .replace(' ', 'T') // tolera "yyyy-MM-dd HH:mm:ss"
        .replace(/(\.\d{3})\d+/, '$1'); // corta nanos → ms

    return new Date(normalized).getTime();
};

const formatRelativeDate = (date: string): string => {
    const time = parseDate(date);

    if (Number.isNaN(time)) return '';

    const diffMs = Date.now() - time;
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMin < 1) return 'agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

    const diffMonths = Math.floor(diffDays / 30);
    return `há ${diffMonths} ${diffMonths > 1 ? 'meses' : 'mês'}`;
};

export default formatRelativeDate;
